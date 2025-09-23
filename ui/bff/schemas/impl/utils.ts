import { Saider } from 'signify-ts';

/**
 * Generate a Self-Addressing Identifier (SAID) for a JSON schema
 * @param schema The JSON schema object
 * @returns The SAID as a string
 */
export function generateSAID(schema: Record<string, any>): string {
  // Clone the schema to avoid mutating the original
  const clone = JSON.parse(JSON.stringify(schema));

  // First, compute SAID for the attributes block using 'd' label
  const attributesBlock = {
    d: '', // Required for SAID computation
    ...clone
  };
  delete attributesBlock.$id; // Remove $id before SAIDifying
  const [saider, saidifiedAttributesBlock] = Saider.saidify(attributesBlock, undefined, undefined, 'd');

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