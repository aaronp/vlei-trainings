import React, { useState, useEffect } from 'react';
import { Saider } from 'signify-ts';
import { schemaServerService } from '../services/schemaServer.service';
import { getSchemaService, type SchemaData, type CredentialField, type CreateSchemaRequest } from '../services/schemaStorage.js';

// Legacy interface for backward compatibility
export interface CredentialSchema {
  said: string;
  name: string;
  description?: string;
  fields: CredentialField[];
  createdAt: string;
  jsonSchema?: any; // Store the complete JSON schema for OOBI resolution
}

interface SchemaManagerProps {
  onSchemaSelect: (schema: CredentialSchema) => void;
  selectedSchema: CredentialSchema | null;
}

export const SchemaManager: React.FC<SchemaManagerProps> = ({ onSchemaSelect, selectedSchema }) => {
  const [schemas, setSchemas] = useState<CredentialSchema[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newSchema, setNewSchema] = useState<Partial<CredentialSchema>>({
    name: '',
    description: '',
    fields: []
  });

  // Load schemas from SchemaService
  useEffect(() => {
    loadSchemas();
  }, []);

  const loadSchemas = async () => {
    setLoading(true);
    try {
      const schemaService = getSchemaService();
      const result = await schemaService.listSchemas({
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      // Convert SchemaData to legacy CredentialSchema format
      const legacySchemas: CredentialSchema[] = result.schemas.map(schema => ({
        said: schema.metadata.said,
        name: schema.metadata.name,
        description: schema.metadata.description,
        fields: schema.fields || [],
        createdAt: schema.metadata.createdAt,
        jsonSchema: schema.jsonSchema
      }));

      setSchemas(legacySchemas);
    } catch (error) {
      console.error('Failed to load schemas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchema = async () => {
    if (!newSchema.name) return;

    setLoading(true);
    try {
      // Build the JSON Schema structure
      const jsonSchema = {
        $id: '', // Required empty field for SAID computation
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: newSchema.name,
        description: newSchema.description || '',
        type: 'object',
        credentialType: newSchema.name.replace(/\s+/g, ''),
        version: '1.0.0',
        properties: {
          v: { description: 'Credential Version String', type: 'string' },
          d: { description: 'Credential SAID', type: 'string' },
          u: { description: 'One time use nonce', type: 'string' },
          i: { description: 'Issuer AID', type: 'string' },
          ri: { description: 'Registry SAID', type: 'string' },
          s: { description: 'Schema SAID', type: 'string' },
          a: {
            oneOf: [
              { description: 'Attributes block SAID', type: 'string' },
              {
                $id: '', // Will be computed for attributes block
                description: 'Attributes block',
                type: 'object',
                properties: {
                  d: { description: 'Attributes data SAID', type: 'string' },
                  i: { description: 'Issuee AID', type: 'string' },
                  dt: { description: 'Issuance date time', type: 'string', format: 'date-time' },
                  // Add custom fields from form
                  ...(newSchema.fields || []).reduce((props, field) => {
                    props[field.name] = {
                      description: field.label,
                      type: field.type === 'select' ? 'string' : field.type,
                      ...(field.options && { enum: field.options })
                    };
                    return props;
                  }, {} as any)
                },
                additionalProperties: false,
                required: ['d', 'i', 'dt', ...(newSchema.fields || []).filter(f => f.required).map(f => f.name)]
              }
            ]
          }
        },
        additionalProperties: false,
        required: ['v', 'd', 'i', 'ri', 's', 'a']
      };

      // First, compute SAID for the attributes block using 'd' label
      const attributesBlock = { 
        d: '', // Required for SAID computation
        ...(jsonSchema.properties.a as any).oneOf[1] 
      };
      delete attributesBlock.$id; // Remove $id before SAIDifying
      const [, saidifiedAttributesBlock] = Saider.saidify(attributesBlock, undefined, undefined, 'd');
      
      // Update the attributes block in the schema with computed SAID in $id
      (jsonSchema.properties.a as any).oneOf[1] = {
        ...saidifiedAttributesBlock,
        $id: saidifiedAttributesBlock.d // Move the SAID to $id for JSON Schema
      };
      delete (jsonSchema.properties.a as any).oneOf[1].d; // Remove d from attributes block

      // Then compute SAID for the entire schema using '$id' label
      const [saider, saidifiedSchema] = Saider.saidify(jsonSchema, undefined, undefined, '$id');

      // Create schema request for the service
      const createRequest: CreateSchemaRequest = {
        name: newSchema.name,
        description: newSchema.description || '',
        jsonSchema: saidifiedSchema,
        fields: newSchema.fields || [],
        tags: [],
        isPublic: false
      };

      // Use SchemaService to create the schema
      const schemaService = getSchemaService();
      const createdSchema = await schemaService.createSchema(createRequest);

      console.log('Created schema:', createdSchema);

      // Convert to legacy format for backward compatibility
      const legacySchema: CredentialSchema = {
        said: createdSchema.metadata.said,
        name: createdSchema.metadata.name,
        description: createdSchema.metadata.description || '',
        fields: createdSchema.fields || [],
        createdAt: createdSchema.metadata.createdAt,
        jsonSchema: createdSchema.jsonSchema
      };

      // Register the schema with the local schema service for serving
      try {
        schemaServerService.registerSchema(legacySchema);
      } catch (error) {
        console.warn('Failed to register schema with server service:', error);
      }
      
      // Reload schemas from service
      await loadSchemas();
      
      setNewSchema({ name: '', description: '', fields: [] });
      setShowCreateForm(false);
      onSchemaSelect(legacySchema);
    } catch (error) {
      console.error('Failed to create schema:', error);
      alert('Failed to create schema: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const addField = () => {
    const newField: CredentialField = {
      name: '',
      label: '',
      type: 'text',
      required: false
    };
    setNewSchema({
      ...newSchema,
      fields: [...(newSchema.fields || []), newField]
    });
  };

  const updateField = (index: number, field: CredentialField) => {
    const fields = [...(newSchema.fields || [])];
    fields[index] = field;
    setNewSchema({ ...newSchema, fields });
  };

  const removeField = (index: number) => {
    const fields = [...(newSchema.fields || [])];
    fields.splice(index, 1);
    setNewSchema({ ...newSchema, fields });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Credential Schemas</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
        >
          Create Schema
        </button>
      </div>

      {/* Schema Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Schema
        </label>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
            value={selectedSchema?.said || ''}
            onChange={(e) => {
              const schema = schemas.find(s => s.said === e.target.value);
              if (schema) onSchemaSelect(schema);
            }}
          >
            <option value="">Select a schema...</option>
            {schemas.map((schema) => (
              <option key={schema.said} value={schema.said}>
                {schema.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedSchema && (
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-600">
            <strong>Selected:</strong> {selectedSchema.name}
          </p>
          <p className="text-xs text-gray-500">SAID: {selectedSchema.said}</p>
          {selectedSchema.description && (
            <p className="text-xs text-gray-500 mt-1">{selectedSchema.description}</p>
          )}
        </div>
      )}

      {/* Create Schema Modal */}
      {showCreateForm && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6 relative z-20">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Create New Schema
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-4">
                    <p className="text-sm text-blue-700">
                      <strong>Note:</strong> The Schema SAID will be automatically computed from the schema structure using cryptographic hashing, similar to the 'kli saidify' command-line tool.
                    </p>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded">
                    <p className="text-sm text-amber-700">
                      <strong>Schema Serving:</strong> Custom schemas need to be served from a schema server (like vlei-server) to be accessible via OOBI resolution. This demo registers schemas locally, but in production you would need to:
                    </p>
                    <ul className="text-xs text-amber-600 mt-1 list-disc list-inside">
                      <li>Deploy the schema to a schema server</li>
                      <li>Make it available at: <code>http://server:port/oobi/[SCHEMA_SAID]</code></li>
                      <li>Ensure KERIA can access the schema server</li>
                    </ul>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Schema Name</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      value={newSchema.name || ''}
                      onChange={(e) => setNewSchema({ ...newSchema, name: e.target.value })}
                      placeholder="Enter schema name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
                    <textarea
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      value={newSchema.description || ''}
                      onChange={(e) => setNewSchema({ ...newSchema, description: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">Fields</label>
                      <button
                        type="button"
                        onClick={addField}
                        className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                      >
                        Add Field
                      </button>
                    </div>
                    
                    {(newSchema.fields || []).map((field, index) => (
                      <div key={index} className="border p-3 rounded mb-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Field name"
                            className="border-gray-300 rounded"
                            value={field.name}
                            onChange={(e) => updateField(index, { ...field, name: e.target.value })}
                          />
                          <input
                            type="text"
                            placeholder="Field label"
                            className="border-gray-300 rounded"
                            value={field.label}
                            onChange={(e) => updateField(index, { ...field, label: e.target.value })}
                          />
                          <select
                            className="border-gray-300 rounded"
                            value={field.type}
                            onChange={(e) => updateField(index, { ...field, type: e.target.value as any })}
                          >
                            <option value="text">Text</option>
                            <option value="textarea">Textarea</option>
                            <option value="select">Select</option>
                            <option value="date">Date</option>
                            <option value="number">Number</option>
                          </select>
                          <div className="flex items-center space-x-2">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => updateField(index, { ...field, required: e.target.checked })}
                              />
                              <span className="ml-1 text-xs">Required</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => removeField(index)}
                              className="text-red-600 hover:text-red-900 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        {field.type === 'select' && (
                          <input
                            type="text"
                            placeholder="Options (comma-separated)"
                            className="mt-2 w-full border-gray-300 rounded text-xs"
                            value={field.options?.join(', ') || ''}
                            onChange={(e) => updateField(index, { 
                              ...field, 
                              options: e.target.value.split(',').map(s => s.trim()) 
                            })}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleCreateSchema}
                  disabled={!newSchema.name || loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Schema'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewSchema({ name: '', description: '', fields: [] });
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};