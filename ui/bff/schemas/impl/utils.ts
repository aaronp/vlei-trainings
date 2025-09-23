import { Saider, Saidify } from 'signify-ts';

/**
 * Generate a Self-Addressing Identifier (SAID) for a JSON schema
 * @param schema The JSON schema object
 * @returns The SAID as a string
 */
export function generateSAID(schema: Record<string, any>): string {
  // Clone the schema to avoid mutating the original
  const schemaWithLabel = JSON.parse(JSON.stringify(schema));
  
  // Add the $id field with placeholder for SAID if not present
  if (!schemaWithLabel.$id) {
    schemaWithLabel.$id = '';
  }
  
  // Use Saidify to generate the saidified version with the SAID
  const [, sad] = Saidify.saidify(schemaWithLabel);
  
  // Create Saider from the saidified data
  const saider = new Saider({ sad });
  
  return saider.qb64;
}

/**
 * Validate that a schema has a valid structure
 * @param schema The schema to validate
 * @returns true if valid, throws error if invalid
 */
export function validateSchema(schema: Record<string, any>): boolean {
  if (!schema || typeof schema !== 'object') {
    throw new Error('Schema must be a valid object');
  }
  
  // Basic JSON Schema validation
  if (!schema.$schema && !schema.type && !schema.properties) {
    throw new Error('Schema must have at least one of: $schema, type, or properties');
  }
  
  return true;
}

/**
 * Prepare a schema for storage/transmission with its SAID
 * @param schema The schema to prepare
 * @returns The schema with SAID embedded
 */
export function prepareSchemaWithSAID(schema: Record<string, any>): Record<string, any> {
  const said = generateSAID(schema);
  const schemaWithSAID = JSON.parse(JSON.stringify(schema));
  
  // Set the $id field to the generated SAID
  schemaWithSAID.$id = said;
  
  return schemaWithSAID;
}