// Schema server service - integrates with SchemaService for REST API
import type { CredentialSchema } from '../components/SchemaManager';
import { getSchemaService } from './schemaStorage.js';

export class SchemaServerService {
  private serverUrl: string;

  constructor(serverUrl?: string) {
    // Default to current origin in browser, fallback for Node.js
    this.serverUrl = serverUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');
  }

  // Register a schema for serving (legacy compatibility)
  registerSchema(schema: CredentialSchema): void {
    // This method is now a no-op since schemas are automatically 
    // available via the SchemaService integration
    console.log(`Schema ${schema.said} is available via SchemaService`);
  }

  // Get OOBI URL for a schema
  getSchemaOOBI(schemaSaid: string): string {
    return `${this.serverUrl}/oobi/${schemaSaid}`;
  }

  // Get all registered schemas via SchemaService
  async getRegisteredSchemas(): Promise<Map<string, any>> {
    try {
      const schemaService = getSchemaService();
      const result = await schemaService.listSchemas();
      const schemas = new Map();
      
      result.schemas.forEach(schema => {
        schemas.set(schema.metadata.said, schema.jsonSchema);
      });
      
      return schemas;
    } catch (error) {
      console.error('Failed to get schemas from SchemaService:', error);
      return new Map();
    }
  }

  // Check if schema is registered via SchemaService
  async hasSchema(schemaSaid: string): Promise<boolean> {
    try {
      const schemaService = getSchemaService();
      return await schemaService.schemaExists(schemaSaid);
    } catch (error) {
      console.error('Failed to check schema existence:', error);
      return false;
    }
  }

  // Get schema data via SchemaService
  async getSchemaData(schemaSaid: string): Promise<any | null> {
    try {
      const schemaService = getSchemaService();
      const schema = await schemaService.getSchemaBySaid(schemaSaid);
      return schema?.jsonSchema || null;
    } catch (error) {
      console.error('Failed to get schema data:', error);
      return null;
    }
  }

  // Get server status and schema count
  async getServerStatus(): Promise<{ available: boolean; schemaCount: number; serverUrl: string }> {
    try {
      const schemas = await this.getRegisteredSchemas();
      return {
        available: true,
        schemaCount: schemas.size,
        serverUrl: this.serverUrl
      };
    } catch (error) {
      return {
        available: false,
        schemaCount: 0,
        serverUrl: this.serverUrl
      };
    }
  }

  // Create an OOBI response for a schema via SchemaService
  async createOOBIResponse(schemaSaid: string): Promise<any> {
    const schemaData = await this.getSchemaData(schemaSaid);
    if (!schemaData) {
      throw new Error(`Schema ${schemaSaid} not found`);
    }

    // Return the schema data in the format expected by OOBI resolution
    return schemaData;
  }

  // Get schema via REST API (for testing)
  async getSchemaViaAPI(schemaSaid: string): Promise<any> {
    try {
      const response = await fetch(`${this.serverUrl}/oobi/${schemaSaid}`);
      if (!response.ok) {
        throw new Error(`Schema not found: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch schema via API:', error);
      throw error;
    }
  }
}

// Global instance for the app
export const schemaServerService = new SchemaServerService();