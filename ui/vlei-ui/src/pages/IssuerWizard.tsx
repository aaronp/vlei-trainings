import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCredentialService } from '../services/credential.service';
import { createIPEXService } from '../services/ipex.service';
import { wizardStateService, type IssuerWizardState, type WizardStep } from '../services/wizardState.service';
import { useKeriStore } from '../store/keriStore';

interface StepProps {
  state: IssuerWizardState;
  onNext: (data: any) => void;
  onBack: () => void;
  isLoading: boolean;
}

const StepIndicator: React.FC<{ steps: WizardStep[]; currentStep: number }> = ({ steps, currentStep }) => (
  <div className="mb-8">
    <div className="flex items-center">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${index < currentStep
                ? 'bg-green-500 text-white'
                : index === currentStep
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}>
              {index < currentStep ? '✓' : index + 1}
            </div>
            <div className="ml-3">
              <div className={`text-sm font-medium ${index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                }`}>
                {step.title}
              </div>
              <div className="text-xs text-gray-500">{step.description}</div>
            </div>
          </div>
          {index < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-4 ${index < currentStep ? 'bg-green-500' : 'bg-gray-300'
              }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  </div>
);

const SelectAIDStep: React.FC<StepProps> = ({ state, onNext, onBack }) => {
  const { aids, isConnected, refreshAIDs } = useKeriStore();
  const [selectedAid, setSelectedAid] = useState(state.selectedAid);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected && aids.length === 0) {
      setLoading(true);
      refreshAIDs().finally(() => setLoading(false));
    }
  }, [isConnected, aids.length, refreshAIDs]);

  const handleNext = () => {
    if (selectedAid) {
      onNext({ selectedAid });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Issuer AID</h2>
        <p className="text-gray-600">Choose which of your AIDs will issue the credential</p>
      </div>

      {!isConnected ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Please connect to KERIA first.</p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="text-blue-600 hover:text-blue-800"
          >
            Go to Dashboard to connect
          </button>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : aids.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No AIDs found. You need to create an AID first.</p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="text-blue-600 hover:text-blue-800"
          >
            Go to Dashboard to create an AID
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {aids.map((aid) => (
            <div key={aid.i} className="border rounded-lg p-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="selectedAid"
                  value={aid.name}
                  checked={selectedAid === aid.name}
                  onChange={(e) => setSelectedAid(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">{aid.name}</div>
                  <div className="text-sm text-gray-500 break-all">{aid.i}</div>
                </div>
              </label>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-800"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!selectedAid || loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const SetupRegistryStep: React.FC<StepProps> = ({ state, onNext, onBack }) => {
  const { keriaService } = useKeriStore();
  const [registryName, setRegistryName] = useState('');
  const [existingRegistries, setExistingRegistries] = useState<any[]>([]);
  const [useExisting, setUseExisting] = useState(false);
  const [selectedRegistry, setSelectedRegistry] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingRegistries, setLoadingRegistries] = useState(false);

  useEffect(() => {
    if (state.selectedAid && keriaService) {
      loadExistingRegistries();
    }
  }, [state.selectedAid, keriaService]);

  const loadExistingRegistries = async () => {
    if (!state.selectedAid || !keriaService) return;

    setLoadingRegistries(true);
    try {
      const credentialService = createCredentialService(keriaService);
      const registries = await credentialService.listRegistries(state.selectedAid);
      setExistingRegistries(registries);

      // If there are existing registries, default to using existing
      if (registries.length > 0) {
        setUseExisting(true);
      }
    } catch (error) {
      console.error('Failed to load existing registries:', error);
      setExistingRegistries([]);
    } finally {
      setLoadingRegistries(false);
    }
  };

  const handleNext = async () => {
    if (!state.selectedAid || !keriaService) return;

    setLoading(true);
    try {
      const credentialService = createCredentialService(keriaService);

      let registry;
      if (useExisting && selectedRegistry) {
        registry = existingRegistries.find(r => r.name === selectedRegistry);
        if (!registry) {
          throw new Error('Selected registry not found');
        }
      } else if (registryName.trim()) {
        registry = await credentialService.createRegistry(state.selectedAid, registryName.trim());
        // Refresh the list after creating
        await loadExistingRegistries();
      }

      if (registry) {
        onNext({ registry });
      }
    } catch (error) {
      console.error('Failed to setup registry:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Registry</h2>
        <p className="text-gray-600">Create or select a credential registry for managing credentials</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="flex items-center">
            <input
              type="radio"
              checked={!useExisting}
              onChange={() => setUseExisting(false)}
              className="mr-3"
            />
            <span className="font-medium">Create New Registry</span>
          </label>
          {!useExisting && (
            <div className="mt-3 ml-6">
              <input
                type="text"
                value={registryName}
                onChange={(e) => setRegistryName(e.target.value)}
                placeholder="Enter registry name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="radio"
              checked={useExisting}
              onChange={() => setUseExisting(true)}
              className="mr-3"
            />
            <span className="font-medium">Use Existing Registry</span>
            {loadingRegistries && (
              <span className="ml-2 text-sm text-gray-500">(Loading...)</span>
            )}
          </label>
          {useExisting && (
            <div className="mt-3 ml-6">
              {existingRegistries.length === 0 ? (
                <p className="text-sm text-gray-500">No existing registries found</p>
              ) : (
                <select
                  value={selectedRegistry}
                  onChange={(e) => setSelectedRegistry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a registry</option>
                  {existingRegistries.map((registry) => (
                    <option key={registry.name} value={registry.name}>
                      {registry.name} ({registry.regk?.substring(0, 12)}...)
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-800"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={loading || (!useExisting && !registryName.trim()) || (useExisting && !selectedRegistry)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Setting up...' : 'Next'}
        </button>
      </div>
    </div>
  );
};

const ChooseSchemaStep: React.FC<StepProps> = ({ onNext, onBack }) => {
  const [existingSchemas, setExistingSchemas] = useState<any[]>([]);
  const [useExisting, setUseExisting] = useState(true);
  const [selectedSchema, setSelectedSchema] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSchemaName, setNewSchemaName] = useState('');
  const [newSchemaDescription, setNewSchemaDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExistingSchemas();
  }, []);

  const loadExistingSchemas = () => {
    try {
      // Load schemas from localStorage (from SchemaManager)
      const saved = localStorage.getItem('credentialSchemas');
      const savedSchemas = saved ? JSON.parse(saved) : [];

      setExistingSchemas(savedSchemas);

      // If no schemas exist, default to create new
      if (savedSchemas.length === 0) {
        setUseExisting(false);
      }
    } catch (error) {
      console.error('Failed to load schemas:', error);
      setExistingSchemas([]);
      setUseExisting(false);
    }
  };

  const handleCreateNewSchema = () => {
    setLoading(true);
    try {
      // This would normally create a schema using SchemaManager logic
      // For now, create a simple mock schema
      const newSchema = {
        said: `E${Math.random().toString(36).substring(2, 15)}`, // Mock SAID
        name: newSchemaName,
        description: newSchemaDescription,
        type: 'custom',
        createdAt: new Date().toISOString()
      };

      // Add to existing schemas
      const updatedSchemas = [...existingSchemas, newSchema];
      setExistingSchemas(updatedSchemas);

      // Save to localStorage
      const customSchemas = updatedSchemas.filter(s => s.type === 'custom');
      localStorage.setItem('credentialSchemas', JSON.stringify(customSchemas));

      // Select the new schema
      setSelectedSchema(newSchema.said);
      setShowCreateForm(false);
      setUseExisting(true);
    } catch (error) {
      console.error('Failed to create schema:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    let schema;
    if (useExisting && selectedSchema) {
      schema = existingSchemas.find(s => s.said === selectedSchema);
    }

    if (schema) {
      onNext({ schema });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Schema</h2>
        <p className="text-gray-600">Select the credential type and schema for this issuance</p>
      </div>

      <div className="space-y-4">

        {/* Use Existing Schema */}
        <div>
          <label className="flex items-center">
            <input
              type="radio"
              checked={useExisting}
              onChange={() => {
                setUseExisting(true);
                setShowCreateForm(false);
              }}
              className="mr-3"
            />
            <span className="font-medium">Use Existing Schema (Recommended)</span>
          </label>
          {useExisting && (
            <div className="mt-3 ml-6 space-y-3">
              {existingSchemas.length === 0 ? (
                <p className="text-sm text-gray-500">No existing schemas found</p>
              ) : (
                existingSchemas.map((schema) => (
                  <div key={schema.said} className="border rounded-lg p-4">
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="radio"
                        name="selectedSchema"
                        value={schema.said}
                        checked={selectedSchema === schema.said}
                        onChange={(e) => setSelectedSchema(e.target.value)}
                        className="mr-3 mt-1"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{schema.name}</span>
                          {schema.type === 'built-in' && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">Built-in</span>
                          )}
                          {schema.type === 'custom' && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">Custom</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">{schema.description}</div>
                        <div className="text-xs text-gray-400 break-all">SAID: {schema.said}</div>
                      </div>
                    </label>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Create New Schema */}
        <div>
          <label className="flex items-center">
            <input
              type="radio"
              checked={!useExisting}
              onChange={() => {
                setUseExisting(false);
                setShowCreateForm(true);
              }}
              className="mr-3"
            />
            <span className="font-medium">Create New Schema</span>
          </label>
          {showCreateForm && (
            <div className="mt-3 ml-6 space-y-4 border rounded-lg p-4 bg-gray-50">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schema Name
                </label>
                <input
                  type="text"
                  value={newSchemaName}
                  onChange={(e) => setNewSchemaName(e.target.value)}
                  placeholder="e.g., Employee Badge"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newSchemaDescription}
                  onChange={(e) => setNewSchemaDescription(e.target.value)}
                  placeholder="Describe what this credential type is used for"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleCreateNewSchema}
                disabled={loading || !newSchemaName.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                {loading ? 'Creating...' : 'Create Schema'}
              </button>
              <div className="text-xs text-gray-500">
                Note: This creates a basic schema. For advanced schema design, use the Schema Manager.
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-800"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={(useExisting && !selectedSchema) || (!useExisting && !showCreateForm)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const CreateCredentialStep: React.FC<StepProps> = ({ state, onNext, onBack }) => {
  const {
    keriaService,
    aids,
    isConnected,
    initialize,
    connect,
    passcode
  } = useKeriStore();
  const [credentialData, setCredentialData] = useState<Record<string, any>>({});
  const [holderAid, setHolderAid] = useState(state.holderAid);
  const [holderAidInput, setHolderAidInput] = useState(state.holderAid);
  const [useExistingAid, setUseExistingAid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [schemaFields, setSchemaFields] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [serviceInitializing, setServiceInitializing] = useState(false);

  useEffect(() => {
    if (state.schema) {
      loadSchemaFields();
    }
  }, [state.schema]);

  useEffect(() => {
    // Reinitialize KERIA service if it's missing but we have connection info
    const initializeServiceIfNeeded = async () => {
      if (!keriaService && passcode && !serviceInitializing) {
        setServiceInitializing(true);
        setError('');
        try {
          await initialize('http://localhost:3901', 'http://localhost:3903', passcode);
          if (!isConnected) {
            await connect();
          }
        } catch (error) {
          console.error('Failed to reinitialize KERIA service:', error);
          setError('Failed to reinitialize KERIA connection. Please go back to the dashboard and reconnect.');
        } finally {
          setServiceInitializing(false);
        }
      }
    };

    initializeServiceIfNeeded();
  }, [keriaService, passcode, isConnected, serviceInitializing, initialize, connect]);

  const loadSchemaFields = () => {
    if (!state.schema) return;

    // For all schemas, try to extract fields from the schema definition
    loadCustomSchemaFields();
  };

  const loadCustomSchemaFields = () => {
    if (!state.schema) return;

    try {
      // Load schema from localStorage if it's a custom schema
      const saved = localStorage.getItem('credentialSchemas');
      const savedSchemas = saved ? JSON.parse(saved) : [];
      const fullSchema = savedSchemas.find((s: any) => s.said === state.schema!.said);

      if (fullSchema && fullSchema.fields) {
        // Use the fields from the custom schema
        setSchemaFields(fullSchema.fields);

        // Initialize with default values
        const initialData: Record<string, any> = {};
        fullSchema.fields.forEach((field: any) => {
          if (field.type === 'select' && field.options) {
            initialData[field.name] = field.options[0];
          } else {
            initialData[field.name] = '';
          }
        });
        setCredentialData(initialData);
      } else {
        // Fallback: create generic fields for unknown schemas
        const genericFields = [
          {
            name: 'title',
            label: 'Title',
            type: 'text',
            required: true,
            placeholder: 'Enter credential title'
          },
          {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            required: false,
            placeholder: 'Enter credential description'
          }
        ];
        setSchemaFields(genericFields);
        setCredentialData({ title: '', description: '' });
      }
    } catch (error) {
      console.error('Failed to load custom schema fields:', error);
      // Use generic fields as fallback
      const genericFields = [
        {
          name: 'value',
          label: 'Value',
          type: 'text',
          required: true,
          placeholder: 'Enter credential value'
        }
      ];
      setSchemaFields(genericFields);
      setCredentialData({ value: '' });
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setCredentialData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const renderField = (field: any) => {
    const { name, label, type, required, placeholder, options } = field;

    switch (type) {
      case 'select':
        return (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <select
              value={credentialData[name] || ''}
              onChange={(e) => handleFieldChange(name, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {options?.map((option: string) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>
        );

      case 'textarea':
        return (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={credentialData[name] || ''}
              onChange={(e) => handleFieldChange(name, e.target.value)}
              placeholder={placeholder}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        );

      case 'date':
        return (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="date"
              value={credentialData[name] || ''}
              onChange={(e) => handleFieldChange(name, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        );

      case 'number':
        return (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              value={credentialData[name] || ''}
              onChange={(e) => handleFieldChange(name, e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        );

      default: // text
        return (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={credentialData[name] || ''}
              onChange={(e) => handleFieldChange(name, e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        );
    }
  };

  const validateForm = () => {
    if (!holderAid) return false;

    // Check required fields
    for (const field of schemaFields) {
      if (field.required && (!credentialData[field.name] || credentialData[field.name].trim() === '')) {
        return false;
      }
    }
    return true;
  };

  const handleNext = async () => {
    setError('');

    // Debug validation
    console.log('CreateCredential handleNext called with:', {
      selectedAid: state.selectedAid,
      registry: state.registry,
      schema: state.schema,
      holderAid,
      credentialData,
      keriaService: !!keriaService
    });

    if (!state.selectedAid) {
      setError('No issuer AID selected');
      return;
    }
    if (!state.registry) {
      setError('No registry selected');
      return;
    }
    if (!state.schema) {
      setError('No schema selected');
      return;
    }
    if (!holderAid) {
      setError('No holder AID specified');
      return;
    }
    if (!keriaService) {
      if (serviceInitializing) {
        setError('KERIA service is initializing, please wait...');
      } else {
        setError('KERIA service not available. Please go back to the dashboard and reconnect.');
      }
      return;
    }

    setLoading(true);
    try {
      // Resolve holder AID - if it's a name from our wallet, get the identifier
      let resolvedHolderAid = holderAid;
      if (useExistingAid) {
        const holderAidObj = aids.find(aid => aid.name === holderAid);
        if (holderAidObj) {
          resolvedHolderAid = holderAidObj.i;
        }
      }

      console.log('Creating credential with params:', {
        issuerAlias: state.selectedAid,
        holderAid: resolvedHolderAid,
        registryName: state.registry.name,
        schemaId: state.schema.said,
        attributes: credentialData
      });

      // Step 1: Resolve schema OOBI for all schemas
      console.log('Resolving schema OOBI:', state.schema.said);

      try {
        // For all schemas, try to resolve OOBI
        // This is a simplified approach - in a real app, schemas should be served properly
        const schemaOOBI = `http://localhost:3001/oobi/${state.schema.said}`;
        console.log('Attempting to resolve schema OOBI:', schemaOOBI);

        await keriaService.resolveOOBI(schemaOOBI, `schema-${state.schema.said}`);
        console.log('Schema OOBI resolved successfully');
      } catch (oobiError) {
        console.warn('Schema OOBI resolution failed, proceeding anyway:', oobiError);
        // For demo purposes, we'll continue even if OOBI resolution fails
        // In production, this should be properly handled
      }

      // Step 2: Create the credential
      const credentialService = createCredentialService(keriaService);

      const result = await credentialService.issueCredential({
        issuerAlias: state.selectedAid,
        holderAid: resolvedHolderAid,
        registryName: state.registry.name,
        schemaId: state.schema.said,
        attributes: credentialData
      });

      console.log('Credential created successfully:', result);

      onNext({ credential: { said: result.said, data: result.credential }, holderAid: resolvedHolderAid });
    } catch (error) {
      console.error('Failed to create credential:', error);

      // Check if it's a schema OOBI error and provide helpful guidance
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('not found. It must be loaded with data oobi')) {
        setError(`Schema not available: The schema "${state.schema.name}" (${state.schema.said}) needs to be served via OOBI. This is a limitation of the demo - custom schemas need to be properly served by a schema server.`);
      } else {
        setError(`Failed to create credential: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Credential</h2>
        <p className="text-gray-600">Fill in the credential data and specify the holder</p>
      </div>

      {/* Service Initialization Status */}
      {serviceInitializing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2 mt-0.5"></div>
            <div>
              <h3 className="text-sm font-medium text-blue-800">Initializing</h3>
              <p className="text-sm text-blue-700 mt-1">Reconnecting to KERIA service...</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Holder AID Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Holder AID
          </label>

          <div className="space-y-3">
            {/* Use Existing AID from your wallet */}
            <div>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={useExistingAid}
                  onChange={() => {
                    setUseExistingAid(true);
                    if (aids.length > 0) {
                      setHolderAid(aids[0].name);
                    }
                  }}
                  className="mr-3"
                />
                <span className="font-medium">Select from my AIDs</span>
              </label>
              {useExistingAid && (
                <div className="mt-2 ml-6">
                  {aids.length === 0 ? (
                    <p className="text-sm text-gray-500">No AIDs available in your wallet</p>
                  ) : (
                    <select
                      value={holderAid}
                      onChange={(e) => setHolderAid(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {aids.map((aid) => (
                        <option key={aid.name} value={aid.name}>
                          {aid.name} ({aid.i?.substring(0, 12)}...)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            {/* Enter AID manually */}
            <div>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!useExistingAid}
                  onChange={() => {
                    setUseExistingAid(false);
                    setHolderAid(holderAidInput);
                  }}
                  className="mr-3"
                />
                <span className="font-medium">Enter AID manually</span>
              </label>
              {!useExistingAid && (
                <div className="mt-2 ml-6">
                  <input
                    type="text"
                    value={holderAidInput}
                    onChange={(e) => {
                      setHolderAidInput(e.target.value);
                      setHolderAid(e.target.value);
                    }}
                    placeholder="Enter holder's AID (e.g., EPqFKtQQ8kzLxPD943ytdj6a3JcXV_IDgYGu88PWNli0)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The holder should provide their AID to you via a secure channel
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Schema Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-1">Schema: {state.schema?.name}</h3>
          {(state.schema as any)?.description && (
            <p className="text-xs text-blue-700">{(state.schema as any).description}</p>
          )}
          <p className="text-xs text-blue-600 font-mono mt-1">SAID: {state.schema?.said}</p>
        </div>

        {/* Dynamic Schema Fields */}
        {schemaFields.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Credential Data</h3>
            {schemaFields.map(field => renderField(field))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500">Loading schema fields...</p>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-800"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={loading || !validateForm()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Credential'}
        </button>
      </div>
    </div>
  );
};

const SendGrantStep: React.FC<StepProps> = ({ state, onNext, onBack }) => {
  const { keriaService } = useKeriStore();
  const [loading, setLoading] = useState(false);

  const handleSendGrant = async () => {
    if (!state.selectedAid || !state.credential || !state.holderAid || !keriaService) return;

    setLoading(true);
    try {
      const ipexService = createIPEXService(keriaService);

      const result = await ipexService.sendGrant(
        state.selectedAid,
        state.credential.said,
        state.holderAid
      );

      onNext({ grantSaid: result.grantSaid });
    } catch (error) {
      console.error('Failed to send grant:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Send to Holder</h2>
        <p className="text-gray-600">Send the credential offer via IPEX to the holder</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Credential Summary</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <div>Holder: {state.holderAid}</div>
          <div>Schema: {state.schema?.name}</div>
          {state.credential && (
            <div>Credential SAID: {state.credential.said}</div>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-800"
        >
          Back
        </button>
        <button
          onClick={handleSendGrant}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Grant'}
        </button>
      </div>
    </div>
  );
};

const CompletionStep: React.FC<StepProps> = ({ state }) => {
  const navigate = useNavigate();
  const nextSteps = wizardStateService.generateNextStepsForHolder(state);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Credential Issued Successfully!</h2>
        <p className="text-gray-600">The credential has been created and sent to the holder via IPEX</p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-medium text-green-900 mb-2">Grant Details</h3>
        <div className="text-sm text-green-700 space-y-1">
          <div>Grant SAID: {state.grantSaid}</div>
          <div>Credential SAID: {state.credential?.said}</div>
          <div>Holder: {state.holderAid}</div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-medium text-amber-900 mb-2">Next Steps for Holder</h3>
        <ul className="text-sm text-amber-700 space-y-1">
          {nextSteps.map((step, index) => (
            <li key={index}>• {step}</li>
          ))}
        </ul>
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={() => navigate('/wizard')}
          className="px-6 py-2 text-gray-600 hover:text-gray-800"
        >
          Start New Process
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export const IssuerWizard: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<IssuerWizardState>(wizardStateService.getIssuerState());

  const steps = wizardStateService.getIssuerSteps();

  const handleNext = (stepData: any) => {
    const newState = { ...state, ...stepData, currentStep: state.currentStep + 1 };
    setState(newState);
    wizardStateService.saveIssuerState(newState);
  };

  const handleBack = () => {
    if (state.currentStep > 0) {
      const newState = { ...state, currentStep: state.currentStep - 1 };
      setState(newState);
      wizardStateService.saveIssuerState(newState);
    } else {
      navigate('/wizard');
    }
  };

  const renderCurrentStep = () => {
    const stepProps = { state, onNext: handleNext, onBack: handleBack, isLoading: false };

    switch (state.currentStep) {
      case 0: return <SelectAIDStep {...stepProps} />;
      case 1: return <SetupRegistryStep {...stepProps} />;
      case 2: return <ChooseSchemaStep {...stepProps} />;
      case 3: return <CreateCredentialStep {...stepProps} />;
      case 4: return <SendGrantStep {...stepProps} />;
      case 5: return <CompletionStep {...stepProps} />;
      default: return <SelectAIDStep {...stepProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Issuer Wizard</h1>
            <p className="text-gray-600 mt-2">Issue a VLEI credential step by step</p>
          </div>

          <StepIndicator steps={steps} currentStep={state.currentStep} />

          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
};