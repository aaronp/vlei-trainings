// Simple local schema server service to serve custom schemas
import type { CredentialSchema } from '../components/SchemaManager';

export class SchemaServerService {
  private schemas: Map<string, any> = new Map();
  private serverUrl: string;

  constructor(serverUrl: string = 'http://localhost:3001') {
    this.serverUrl = serverUrl;
  }

  // Register a schema for serving
  registerSchema(schema: CredentialSchema): void {
    if (schema.jsonSchema) {
      this.schemas.set(schema.said, schema.jsonSchema);
      console.log(`Registered schema ${schema.said} for local serving`);
    }
  }

  // Get OOBI URL for a schema
  getSchemaOOBI(schemaSaid: string): string {
    return `${this.serverUrl}/oobi/${schemaSaid}`;
  }

  // Get all registered schemas
  getRegisteredSchemas(): Map<string, any> {
    return this.schemas;
  }

  // Check if schema is registered
  hasSchema(schemaSaid: string): boolean {
    return this.schemas.has(schemaSaid);
  }

  // Get schema data
  getSchemaData(schemaSaid: string): any | null {
    return this.schemas.get(schemaSaid) || null;
  }

  // Start a simple HTTP server for schemas (development only)
  async startDevelopmentServer(): Promise<void> {
    // Note: This would require a backend service in a real implementation
    // For now, we'll use a different approach
    console.log('Schema server would be available at:', this.serverUrl);
    console.log('Registered schemas:', Array.from(this.schemas.keys()));
  }

  // Create a mock OOBI response for a schema
  createMockOOBIResponse(schemaSaid: string): any {
    const schemaData = this.getSchemaData(schemaSaid);
    if (!schemaData) {
      throw new Error(`Schema ${schemaSaid} not found`);
    }

    // Return the schema data in the format expected by OOBI resolution
    return {
      v: "KERI10JSON000000_",
      t: "sch",
      d: schemaSaid,
      ...schemaData
    };
  }

  // Alternative: Use fetch API to serve schema data directly
  async getSchemaViaFetch(schemaSaid: string): Promise<any> {
    const schemaData = this.getSchemaData(schemaSaid);
    if (!schemaData) {
      throw new Error(`Schema ${schemaSaid} not registered locally`);
    }

    // Return the schema data directly
    return schemaData;
  }
}

// Global instance for the app
export const schemaServerService = new SchemaServerService();