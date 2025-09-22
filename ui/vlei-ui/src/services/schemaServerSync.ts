// Schema Server Sync Utility
// Synchronizes schemas between frontend SchemaService and backend REST API

const SCHEMA_SERVER_URL = window?.location?.origin || 'http://localhost:3000'; // Use same server as UI

export class SchemaServerSync {
  private baseUrl: string;

  constructor(baseUrl: string = SCHEMA_SERVER_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if the schema server is available
   */
  async isServerAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.ok;
    } catch (error) {
      console.warn('Schema server not available:', error);
      return false;
    }
  }

  /**
   * Sync all schemas from frontend localStorage to the backend server
   */
  async syncToServer(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      // Get schemas from localStorage (SchemaService storage format)
      const localStorageData = localStorage.getItem('vlei-schemas');
      if (!localStorageData) {
        return { success: true, count: 0 };
      }

      const schemas = JSON.parse(localStorageData);

      const response = await fetch(`${this.baseUrl}/api/schemas/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schemas)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
      }

      const result = await response.json();
      console.log('✅ Schemas synced to server:', result);

      return { success: true, count: result.synced };
    } catch (error) {
      console.error('❌ Failed to sync schemas to server:', error);
      return {
        success: false,
        count: 0,
        error: (error as Error).message
      };
    }
  }

  /**
   * Auto-sync schemas when they're created or updated
   */
  async autoSync(): Promise<void> {
    if (await this.isServerAvailable()) {
      await this.syncToServer();
    }
  }

  /**
   * Get server information
   */
  async getServerInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/`);
      if (!response.ok) {
        throw new Error('Server not available');
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to get server info:', error);
      return null;
    }
  }

  /**
   * List schemas from the server
   */
  async listServerSchemas(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/schemas`);
      if (!response.ok) {
        throw new Error('Failed to fetch server schemas');
      }
      const result = await response.json();
      return result.schemas || [];
    } catch (error) {
      console.error('Failed to list server schemas:', error);
      return [];
    }
  }

  /**
   * Create a schema directly on the server
   */
  async createSchemaOnServer(schemaData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/schemas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schemaData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create schema');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to create schema on server:', error);
      throw error;
    }
  }
}

// Global instance
export const schemaServerSync = new SchemaServerSync();

// Auto-sync hook for SchemaService
export function setupAutoSync() {
  // Listen for localStorage changes to auto-sync
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function (key: string, value: string) {
    originalSetItem.apply(this, [key, value]);

    // Auto-sync when vlei-schemas changes
    if (key === 'vlei-schemas') {
      setTimeout(() => {
        schemaServerSync.autoSync().catch(console.error);
      }, 100); // Small delay to avoid rapid syncing
    }
  };

  // Initial sync on page load
  setTimeout(() => {
    schemaServerSync.autoSync().catch(console.error);
  }, 1000);
}

// Helper to show sync status in UI
export async function getSyncStatus(): Promise<{
  serverAvailable: boolean;
  localSchemas: number;
  serverSchemas: number;
  lastSync?: string;
}> {
  const serverAvailable = await schemaServerSync.isServerAvailable();

  let localSchemas = 0;
  try {
    const localData = localStorage.getItem('vlei-schemas');
    if (localData) {
      localSchemas = Object.keys(JSON.parse(localData)).length;
    }
  } catch (error) {
    console.warn('Failed to count local schemas:', error);
  }

  let serverSchemas = 0;
  if (serverAvailable) {
    try {
      const schemas = await schemaServerSync.listServerSchemas();
      serverSchemas = schemas.length;
    } catch (error) {
      console.warn('Failed to count server schemas:', error);
    }
  }

  return {
    serverAvailable,
    localSchemas,
    serverSchemas,
    lastSync: localStorage.getItem('vlei-schemas-last-sync') || undefined
  };
}