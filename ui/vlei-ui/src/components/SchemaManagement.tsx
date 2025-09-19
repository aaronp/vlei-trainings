// Advanced Schema Management component with CRUD operations
import React, { useState, useEffect } from 'react';
import { getSchemaService, SchemaData, CreateSchemaRequest, CredentialField, SchemaQuery } from '../services/schemaStorage.js';
import { Saider } from 'signify-ts';

interface SchemaManagementProps {
  onSchemaSelect?: (schema: SchemaData) => void;
  selectedSchemaId?: string;
}

export const SchemaManagement: React.FC<SchemaManagementProps> = ({ 
  onSchemaSelect, 
  selectedSchemaId 
}) => {
  const [schemas, setSchemas] = useState<SchemaData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState<SchemaData | null>(null);
  const [tags, setTags] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState<CreateSchemaRequest>({
    name: '',
    description: '',
    jsonSchema: {},
    fields: [],
    tags: [],
    isPublic: false
  });

  useEffect(() => {
    loadSchemas();
  }, [searchTerm]);

  const loadSchemas = async () => {
    setLoading(true);
    setError('');
    
    try {
      const schemaService = getSchemaService();
      const query: SchemaQuery = {
        search: searchTerm || undefined,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        limit: 100
      };
      
      const result = await schemaService.listSchemas(query);
      setSchemas(result.schemas);
      
      // Extract unique tags
      const allTags = new Set<string>();
      result.schemas.forEach(schema => {
        schema.metadata.tags?.forEach(tag => allTags.add(tag));
      });
      setTags(Array.from(allTags));
      
    } catch (error) {
      console.error('Failed to load schemas:', error);
      setError(`Failed to load schemas: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchema = async () => {
    if (!formData.name.trim()) {
      setError('Schema name is required');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Build JSON Schema
      const jsonSchema = {
        $id: '', // Will be set during SAID computation
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: formData.name,
        description: formData.description || '',
        type: 'object',
        credentialType: formData.name.replace(/\s+/g, ''),
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
                $id: '',
                description: 'Attributes block',
                type: 'object',
                properties: {
                  d: { description: 'Attributes data SAID', type: 'string' },
                  i: { description: 'Issuee AID', type: 'string' },
                  dt: { description: 'Issuance date time', type: 'string', format: 'date-time' },
                  // Add custom fields
                  ...formData.fields.reduce((props, field) => {
                    props[field.name] = {
                      description: field.description || field.label,
                      type: field.type === 'select' ? 'string' : field.type === 'boolean' ? 'boolean' : field.type === 'number' ? 'number' : 'string',
                      ...(field.options && { enum: field.options }),
                      ...(field.validation?.pattern && { pattern: field.validation.pattern }),
                      ...(field.validation?.min && { minimum: field.validation.min }),
                      ...(field.validation?.max && { maximum: field.validation.max }),
                      ...(field.minLength && { minLength: field.minLength }),
                      ...(field.maxLength && { maxLength: field.maxLength })
                    };
                    return props;
                  }, {} as any)
                },
                additionalProperties: false,
                required: ['d', 'i', 'dt', ...formData.fields.filter(f => f.required).map(f => f.name)]
              }
            ]
          }
        },
        additionalProperties: false,
        required: ['v', 'd', 'i', 'ri', 's', 'a']
      };

      // Compute SAID for attributes block
      const attributesBlock = { 
        d: '', 
        ...(jsonSchema.properties.a as any).oneOf[1] 
      };
      delete attributesBlock.$id;
      const [, saidifiedAttributesBlock] = Saider.saidify(attributesBlock, undefined, undefined, 'd');
      
      (jsonSchema.properties.a as any).oneOf[1] = {
        ...saidifiedAttributesBlock,
        $id: saidifiedAttributesBlock.d
      };
      delete (jsonSchema.properties.a as any).oneOf[1].d;

      const request: CreateSchemaRequest = {
        ...formData,
        jsonSchema
      };

      const schemaService = getSchemaService();
      await schemaService.createSchema(request);
      
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        jsonSchema: {},
        fields: [],
        tags: [],
        isPublic: false
      });
      
      await loadSchemas();
      
    } catch (error) {
      console.error('Failed to create schema:', error);
      setError(`Failed to create schema: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchema = async (schema: SchemaData) => {
    if (!confirm(`Are you sure you want to delete "${schema.metadata.name}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const schemaService = getSchemaService();
      await schemaService.deleteSchema(schema.metadata.id);
      await loadSchemas();
    } catch (error) {
      console.error('Failed to delete schema:', error);
      setError(`Failed to delete schema: ${(error as Error).message}`);
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
    setFormData({
      ...formData,
      fields: [...formData.fields, newField]
    });
  };

  const updateField = (index: number, field: CredentialField) => {
    const fields = [...formData.fields];
    fields[index] = field;
    setFormData({ ...formData, fields });
  };

  const removeField = (index: number) => {
    const fields = [...formData.fields];
    fields.splice(index, 1);
    setFormData({ ...formData, fields });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Schema Management</h2>
          <p className="text-gray-600">Create, manage, and organize credential schemas</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Create Schema
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search schemas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <button
          onClick={loadSchemas}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      )}

      {/* Schema List */}
      {!loading && (
        <div className="grid gap-4">
          {schemas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No schemas found matching your search' : 'No schemas available'}
            </div>
          ) : (
            schemas.map((schema) => (
              <div 
                key={schema.metadata.id}
                className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                  selectedSchemaId === schema.metadata.id ? 'ring-2 ring-green-500' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{schema.metadata.name}</h3>
                      {schema.metadata.isPublic && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">Public</span>
                      )}
                    </div>
                    
                    {schema.metadata.description && (
                      <p className="text-gray-600 mb-2">{schema.metadata.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Created: {formatDate(schema.metadata.createdAt)}</span>
                      <span>Updated: {formatDate(schema.metadata.updatedAt)}</span>
                      <span>Fields: {schema.fields?.length || 0}</span>
                    </div>
                    
                    {schema.metadata.tags && schema.metadata.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {schema.metadata.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-2 text-xs text-gray-400 font-mono break-all">
                      SAID: {schema.metadata.said}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    {onSchemaSelect && (
                      <button
                        onClick={() => onSchemaSelect(schema)}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        Select
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedSchema(schema);
                        setShowViewModal(true);
                      }}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteSchema(schema)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Schema Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Create New Schema</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Schema Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter schema name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={formData.tags?.join(', ') || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter tags (comma-separated)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter schema description"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Make this schema public</span>
                  </label>
                </div>

                {/* Fields Section */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Credential Fields
                    </label>
                    <button
                      type="button"
                      onClick={addField}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Add Field
                    </button>
                  </div>
                  
                  {formData.fields.map((field, index) => (
                    <div key={index} className="border p-3 rounded mb-3">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Field name"
                          value={field.name}
                          onChange={(e) => updateField(index, { ...field, name: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Field label"
                          value={field.label}
                          onChange={(e) => updateField(index, { ...field, label: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <select
                          value={field.type}
                          onChange={(e) => updateField(index, { ...field, type: e.target.value as any })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="text">Text</option>
                          <option value="textarea">Textarea</option>
                          <option value="select">Select</option>
                          <option value="date">Date</option>
                          <option value="number">Number</option>
                          <option value="boolean">Boolean</option>
                        </select>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(index, { ...field, required: e.target.checked })}
                            className="mr-1"
                          />
                          <span className="text-xs">Required</span>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => removeField(index)}
                          className="px-2 py-1 text-red-600 hover:text-red-900 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      
                      {field.type === 'select' && (
                        <input
                          type="text"
                          placeholder="Options (comma-separated)"
                          value={field.options?.join(', ') || ''}
                          onChange={(e) => updateField(index, { 
                            ...field, 
                            options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSchema}
                  disabled={!formData.name || loading}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Schema'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Schema Modal */}
      {showViewModal && selectedSchema && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">{selectedSchema.metadata.name}</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>SAID:</strong> {selectedSchema.metadata.said}</div>
                  <div><strong>Version:</strong> {selectedSchema.metadata.version}</div>
                  <div><strong>Created:</strong> {formatDate(selectedSchema.metadata.createdAt)}</div>
                  <div><strong>Updated:</strong> {formatDate(selectedSchema.metadata.updatedAt)}</div>
                </div>

                {selectedSchema.metadata.description && (
                  <div>
                    <strong>Description:</strong>
                    <p className="mt-1 text-gray-600">{selectedSchema.metadata.description}</p>
                  </div>
                )}

                {selectedSchema.metadata.tags && selectedSchema.metadata.tags.length > 0 && (
                  <div>
                    <strong>Tags:</strong>
                    <div className="flex gap-1 mt-1">
                      {selectedSchema.metadata.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSchema.fields && selectedSchema.fields.length > 0 && (
                  <div>
                    <strong>Fields:</strong>
                    <div className="mt-2 space-y-2">
                      {selectedSchema.fields.map((field, index) => (
                        <div key={index} className="border rounded p-3 bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{field.label}</div>
                              <div className="text-sm text-gray-600">Name: {field.name}</div>
                              <div className="text-sm text-gray-600">Type: {field.type}</div>
                              {field.required && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Required</span>
                              )}
                            </div>
                            {field.options && (
                              <div className="text-sm text-gray-600">
                                Options: {field.options.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <strong>JSON Schema:</strong>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-60">
                    {JSON.stringify(selectedSchema.jsonSchema, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};