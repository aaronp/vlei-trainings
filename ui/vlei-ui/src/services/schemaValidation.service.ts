// Schema validation and availability service
import { getSchemaService } from './schemaStorage.js';

export interface SchemaAvailability {
  available: boolean;
  source: 'local' | 'external' | 'unknown';
  warning?: string;
}

export class SchemaValidationService {
  
  // Well-known schema SAIDs that might be available in KERIA
  private wellKnownSchemas = new Set([
    // Add any known schema SAIDs that are commonly available
    // These would be schemas that are pre-loaded in KERIA or available from standard schema servers
  ]);

  /**
   * Check if a schema is likely to be available for credential issuance
   */
  async checkSchemaAvailability(schemaSaid: string): Promise<SchemaAvailability> {
    try {
      // Check if it's a locally registered schema
      const schemaService = getSchemaService();
      const hasSchema = await schemaService.schemaExists(schemaSaid);
      
      if (hasSchema) {
        return {
          available: false, // Not actually available due to OOBI resolution limitations
          source: 'local',
          warning: 'This schema was created locally but needs to be served via OOBI. Consider using an external schema server or pre-existing schemas.'
        };
      }
    } catch (error) {
      console.warn('Failed to check schema availability:', error);
    }

    // Check if it's a well-known schema
    if (this.wellKnownSchemas.has(schemaSaid)) {
      return {
        available: true,
        source: 'external'
      };
    }

    // Unknown schema - might or might not be available
    return {
      available: false,
      source: 'unknown',
      warning: 'This schema may not be available. Ensure it is served by an accessible schema server.'
    };
  }

  /**
   * Get recommendations for schema usage
   */
  getSchemaRecommendations(): string[] {
    return [
      'Use schemas that are pre-loaded in your KERIA instance',
      'Ensure external schema servers are running and accessible',
      'For custom schemas, deploy them to a proper schema server',
      'Test schema availability before creating credentials'
    ];
  }

  /**
   * Add a known working schema SAID
   */
  addWellKnownSchema(schemaSaid: string): void {
    this.wellKnownSchemas.add(schemaSaid);
  }

  /**
   * Check if schema server setup is recommended
   */
  async isSchemaServerSetupRecommended(): Promise<boolean> {
    try {
      // If there are local schemas but no external ones, recommend server setup
      const schemaService = getSchemaService();
      const result = await schemaService.listSchemas({ limit: 1 });
      return result.total > 0;
    } catch (error) {
      console.warn('Failed to check if schema server setup is recommended:', error);
      return false;
    }
  }
}

export const schemaValidationService = new SchemaValidationService();