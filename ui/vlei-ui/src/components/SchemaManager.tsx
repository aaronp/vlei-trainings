import React, { useState, useEffect } from 'react';

export interface CredentialField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'textarea' | 'date' | 'number';
  required: boolean;
  maxLength?: number;
  options?: string[];
}

export interface CredentialSchema {
  said: string;
  name: string;
  description?: string;
  fields: CredentialField[];
  createdAt: string;
}

interface SchemaManagerProps {
  onSchemaSelect: (schema: CredentialSchema) => void;
  selectedSchema: CredentialSchema | null;
}

export const SchemaManager: React.FC<SchemaManagerProps> = ({ onSchemaSelect, selectedSchema }) => {
  const [schemas, setSchemas] = useState<CredentialSchema[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSchema, setNewSchema] = useState<Partial<CredentialSchema>>({
    said: '',
    name: '',
    description: '',
    fields: []
  });

  // Load schemas from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('credentialSchemas');
    if (saved) {
      setSchemas(JSON.parse(saved));
    }
  }, []);

  // Save schemas to localStorage
  const saveSchemas = (updatedSchemas: CredentialSchema[]) => {
    setSchemas(updatedSchemas);
    localStorage.setItem('credentialSchemas', JSON.stringify(updatedSchemas));
  };

  const handleCreateSchema = () => {
    if (!newSchema.said || !newSchema.name) return;

    const schema: CredentialSchema = {
      said: newSchema.said,
      name: newSchema.name,
      description: newSchema.description || '',
      fields: newSchema.fields || [],
      createdAt: new Date().toISOString()
    };

    const updatedSchemas = [...schemas, schema];
    saveSchemas(updatedSchemas);
    
    setNewSchema({ said: '', name: '', description: '', fields: [] });
    setShowCreateForm(false);
    onSchemaSelect(schema);
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Schema SAID</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      value={newSchema.said || ''}
                      onChange={(e) => setNewSchema({ ...newSchema, said: e.target.value })}
                      placeholder="Enter schema SAID"
                    />
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
                  disabled={!newSchema.said || !newSchema.name}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Create Schema
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewSchema({ said: '', name: '', description: '', fields: [] });
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