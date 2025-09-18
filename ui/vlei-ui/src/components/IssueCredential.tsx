import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeriStore } from '../store/keriStore';
import { SchemaManager, type CredentialSchema, type CredentialField } from './SchemaManager';

// Component is now using imported types from SchemaManager

export const IssueCredential: React.FC = () => {
  const navigate = useNavigate();
  const { keriaService, credentialService, aids, isConnected, refreshCredentials } = useKeriStore();

  // State variables
  const [selectedIssuer, setSelectedIssuer] = useState('');
  const [recipientAid, setRecipientAid] = useState('');
  const [registry, setRegistry] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'schema' | 'setup' | 'form' | 'complete'>('schema');

  // Schema and form data
  const [selectedSchema, setSelectedSchema] = useState<CredentialSchema | null>(null);
  const [credentialData, setCredentialData] = useState<Record<string, any>>({});

  // Initialize component
  useEffect(() => {
    if (!isConnected) {
      navigate('/');
      return;
    }
  }, [isConnected, navigate]);

  // Initialize form data when schema changes
  useEffect(() => {
    if (!selectedSchema) return;

    const initialData: Record<string, any> = {};

    selectedSchema.fields.forEach(field => {
      if (field.type === 'date' && field.name.includes('Date')) {
        initialData[field.name] = new Date().toISOString().split('T')[0];
      } else if (field.type === 'select' && field.options) {
        initialData[field.name] = field.options[0];
      } else {
        initialData[field.name] = '';
      }
    });

    setCredentialData(initialData);
  }, [selectedSchema]);

  const handleSetupRegistry = async () => {
    if (!selectedIssuer || !keriaService || !credentialService) return;

    setLoading(true);
    try {
      console.log('Setting up registry for issuer:', selectedIssuer);

      // Check if registry exists
      console.log('Checking for existing registries...');
      const registries = await credentialService.listRegistries(selectedIssuer);
      console.log('Found registries:', registries);

      // Use a unique registry name to avoid conflicts
      const registryName = `${selectedIssuer}-registry`;

      // Check different possible registry name properties
      let existingRegistry = registries.find(r => {
        console.log('Checking registry:', r);
        return r.name === registryName ||
          r.registryName === registryName ||
          r.regk === registryName;
      });

      if (!existingRegistry) {
        // Create new registry
        console.log('Creating new registry with name:', registryName);
        try {
          existingRegistry = await credentialService.createRegistry(selectedIssuer, registryName);
          console.log('Created/fetched registry:', existingRegistry);
        } catch (createError: any) {
          console.error('Registry creation failed:', createError);
          // If creation fails, try to fetch all registries again and use the first one
          const allRegistries = await credentialService.listRegistries(selectedIssuer);
          console.log('All registries after failed creation:', allRegistries);
          if (allRegistries.length > 0) {
            existingRegistry = allRegistries[0];
            console.log('Using first available registry:', existingRegistry);
          } else {
            throw new Error('No registries available and cannot create new one');
          }
        }
      } else {
        console.log('Using existing registry:', existingRegistry);
      }

      setRegistry(existingRegistry);

      // Resolve schema OOBI if schema has a SAID
      if (selectedSchema && selectedSchema.said) {
        const schemaOobi = `http://localhost:7723/oobi/${selectedSchema.said}`;
        console.log('Resolving schema OOBI:', schemaOobi);

        try {
          const resolveOp = await keriaService.resolveOOBI(schemaOobi, `${selectedSchema.name.toLowerCase().replace(/\s+/g, '-')}-schema`);
          console.log('OOBI resolution operation:', resolveOp);

          if (resolveOp.done) {
            console.log('Schema OOBI resolved immediately');
          } else {
            console.log('Schema OOBI resolution started, will continue in background');
          }

          // Background cleanup
          if (resolveOp.name) {
            setTimeout(async () => {
              try {
                await keriaService.deleteOperation(resolveOp.name);
              } catch (e) {
                console.log('Background cleanup completed');
              }
            }, 5000);
          }
        } catch (oobiError) {
          console.warn('OOBI resolution failed, but proceeding:', oobiError);
        }
      }

      setStep('form');
    } catch (error) {
      console.error('Failed to setup registry:', error);
      alert('Failed to setup registry: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Validate recipient AID
    if (!recipientAid.trim()) {
      errors.recipientAid = 'Recipient AID is required';
    } else if (recipientAid.length < 44) {
      errors.recipientAid = 'AID should be at least 44 characters long';
    }

    // Validate schema selection and SAID
    if (!selectedSchema) {
      errors.schema = 'Please select a credential schema';
      setValidationErrors(errors);
      return false;
    }

    if (!selectedSchema.said.trim()) {
      errors.schemaSaid = 'Schema SAID is required';
    }

    // Validate schema-specific fields
    selectedSchema.fields.forEach(field => {
      if (field.required) {
        const value = credentialData[field.name];
        if (!value || String(value).trim() === '') {
          errors[field.name] = `${field.label} is required`;
        } else if (field.name === 'lei' && value.length !== 20) {
          errors[field.name] = 'LEI must be exactly 20 characters';
        } else if (field.type === 'date' && !Date.parse(value)) {
          errors[field.name] = 'Please enter a valid date';
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleIssueCredential = async () => {
    if (!credentialService || !registry || !keriaService) return;

    // Validate form before proceeding
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (!selectedSchema) throw new Error('No schema selected');

      console.log('Proceeding with credential issuance...');

      // Build credential attributes
      const attributes: Record<string, any> = {
        i: recipientAid,
        ...credentialData
      };

      // Issue the credential
      console.log('Issuing credential with:', {
        issuer: selectedIssuer,
        registryId: registry.regk,
        schema: selectedSchema.said,
        schemaName: selectedSchema.name,
        attributes
      });

      const issueResult = await credentialService.getClient()?.credentials().issue(selectedIssuer, {
        ri: registry.regk,
        s: selectedSchema.said,
        a: attributes
      });

      if (!issueResult) {
        throw new Error('issueResult not found for ' + selectedIssuer)
      }
      const operation = await issueResult.op();
      const response = await keriaService.waitForOperation(operation);

      // Get the issued credential
      const credentialSaid = response.response.ced.d;
      const credential = await credentialService.getClient()?.credentials().get(credentialSaid);

      // If recipient is one of our AIDs, grant it to them
      const isOurAid = aids.some(aid => aid.i === recipientAid);
      if (isOurAid && credential) {
        await credentialService.grantCredential(selectedIssuer, credential, recipientAid);
      }

      // Clean up operation after everything is done
      await keriaService.deleteOperation(operation.name);

      await refreshCredentials();

      setSuccessMessage(`Successfully issued ${selectedSchema.name}`);
      setTimeout(() => {
        setSuccessMessage('');
        setStep('complete');
      }, 2000);
    } catch (error) {
      console.error('Failed to issue credential:', error);
      alert('Failed to issue credential: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };


  const getFieldPlaceholder = (field: CredentialField) => {
    switch (field.name.toLowerCase()) {
      case 'lei': return 'e.g., 529900T8BM49AURSDO55';
      case 'legalentityname':
      case 'entityname': return 'e.g., Acme Corporation Ltd';
      case 'qualifiedissuername': return 'e.g., GLEIF Americas LLC';
      case 'legaljurisdiction': return 'e.g., US-DE (Delaware, USA)';
      case 'organization': return 'e.g., GLEIF';
      case 'memberid': return 'e.g., M12345';
      case 'membername': return 'e.g., John Doe';
      case 'role': return 'e.g., Board Member';
      case 'email': return 'e.g., user@example.com';
      case 'phone': return 'e.g., +1-555-123-4567';
      default: return `Enter ${field.label.toLowerCase()}`;
    }
  };

  const renderFormField = (field: CredentialField) => {
    const value = credentialData[field.name] || '';
    const hasError = validationErrors[field.name];
    const fieldClassName = `mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${hasError ? 'border-red-300' : 'border-gray-300'
      }`;

    const handleFieldChange = (newValue: string) => {
      setCredentialData({ ...credentialData, [field.name]: newValue });
      if (hasError) {
        setValidationErrors({ ...validationErrors, [field.name]: '' });
      }
    };

    switch (field.type) {
      case 'select':
        return (
          <div>
            <select
              className={fieldClassName}
              value={value}
              onChange={(e) => handleFieldChange(e.target.value)}
              disabled={loading}
            >
              {field.options?.map((option: string) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {hasError && (
              <p className="mt-1 text-xs text-red-600">{hasError}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div>
            <textarea
              className={fieldClassName}
              value={value}
              onChange={(e) => handleFieldChange(e.target.value)}
              placeholder={getFieldPlaceholder(field)}
              rows={3}
              disabled={loading}
            />
            {hasError && (
              <p className="mt-1 text-xs text-red-600">{hasError}</p>
            )}
          </div>
        );

      default:
        return (
          <div>
            <input
              type={field.type}
              className={fieldClassName}
              value={value}
              onChange={(e) => handleFieldChange(e.target.value)}
              placeholder={getFieldPlaceholder(field)}
              maxLength={field.maxLength}
              disabled={loading}
            />
            {hasError && (
              <p className="mt-1 text-xs text-red-600">{hasError}</p>
            )}
            {field.name === 'lei' && !hasError && (
              <p className="mt-1 text-xs text-gray-500">Must be exactly 20 characters</p>
            )}
          </div>
        );
    }
  };

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  Credential Issued Successfully!
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  The {selectedSchema?.name || 'credential'} has been created and issued.
                </p>
                <div className="mt-6 space-x-3">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Back to Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setStep('schema');
                      setSelectedIssuer('');
                      setRecipientAid('');
                      setSelectedSchema(null);
                      setCredentialData({});
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Issue Another
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded relative">
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Issue Credential
            </h3>
          </div>

          {step === 'schema' ? (
            <div className="px-4 py-5 sm:p-6">
              <SchemaManager
                onSchemaSelect={setSelectedSchema}
                selectedSchema={selectedSchema}
              />
              <div className="pt-5">
                <div className="flex justify-end">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setStep('setup')}
                    disabled={!selectedSchema}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          ) : step === 'setup' ? (
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Select Issuer AID
                  </label>
                  <select
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={selectedIssuer}
                    onChange={(e) => setSelectedIssuer(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Select an AID...</option>
                    {aids.map((aid) => (
                      <option key={aid.name} value={aid.name}>
                        {aid.name} ({aid.i.slice(0, 12)}...)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-5">
                  <div className="flex justify-end">
                    <button
                      onClick={() => setStep('schema')}
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSetupRegistry}
                      disabled={loading || !selectedIssuer}
                      className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {loading ? 'Setting up...' : 'Continue'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : step === 'form' ? (
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">
                    Issuing: <span className="font-medium">{selectedSchema?.name}</span>
                  </p>
                  <p className="text-xs text-gray-500">Schema: {selectedSchema?.said}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Recipient AID
                    <span className="text-red-500"> *</span>
                  </label>
                  <input
                    type="text"
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${validationErrors.recipientAid ? 'border-red-300' : 'border-gray-300'
                      }`}
                    value={recipientAid}
                    onChange={(e) => {
                      setRecipientAid(e.target.value);
                      if (validationErrors.recipientAid) {
                        setValidationErrors({ ...validationErrors, recipientAid: '' });
                      }
                    }}
                    placeholder="E.g., ECGGpD-RAW6WHgHmIhgUy4cr_wcJ1s1MZcYQ78Bx4wto"
                    disabled={loading}
                  />
                  {validationErrors.recipientAid ? (
                    <p className="mt-1 text-xs text-red-600">
                      {validationErrors.recipientAid}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">
                      Enter a 44+ character AID prefix. You can select from your AIDs below or enter an external AID.
                    </p>
                  )}
                  {aids.length > 0 && (
                    <select
                      className="mt-2 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      onChange={(e) => e.target.value && setRecipientAid(e.target.value)}
                      disabled={loading}
                    >
                      <option value="">Or select from your AIDs...</option>
                      {aids.map((aid) => (
                        <option key={aid.i} value={aid.i}>
                          {aid.name} ({aid.i.slice(0, 12)}...)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Dynamic form fields based on selected schema */}
                {selectedSchema?.fields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label}
                      {field.required && <span className="text-red-500"> *</span>}
                    </label>
                    {renderFormField(field)}
                  </div>
                ))}

                <div className="pt-5">
                  <div className="flex justify-end">
                    <button
                      onClick={() => setStep('setup')}
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                      disabled={loading}
                    >
                      Back
                    </button>
                    <button
                      onClick={handleIssueCredential}
                      disabled={loading}
                      className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {loading ? 'Issuing...' : 'Issue Credential'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};