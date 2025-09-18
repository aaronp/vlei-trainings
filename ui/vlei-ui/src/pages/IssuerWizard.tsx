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
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              index < currentStep 
                ? 'bg-green-500 text-white' 
                : index === currentStep
                ? 'bg-blue-500 text-white'
                : 'bg-gray-300 text-gray-600'
            }`}>
              {index < currentStep ? '✓' : index + 1}
            </div>
            <div className="ml-3">
              <div className={`text-sm font-medium ${
                index <= currentStep ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {step.title}
              </div>
              <div className="text-xs text-gray-500">{step.description}</div>
            </div>
          </div>
          {index < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-4 ${
              index < currentStep ? 'bg-green-500' : 'bg-gray-300'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  </div>
);

const SelectAIDStep: React.FC<StepProps> = ({ state, onNext, onBack, isLoading }) => {
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

const SetupRegistryStep: React.FC<StepProps> = ({ state, onNext, onBack, isLoading }) => {
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

const ChooseSchemaStep: React.FC<StepProps> = ({ state, onNext, onBack }) => {
  const [schemas] = useState([
    {
      said: 'EGUPiCVO73M9worPwR3PfThAtC0AJnH5ZgwsXf6TzbVK',
      name: 'Event Pass',
      description: 'Schema for event access credentials'
    }
  ]);
  const [selectedSchema, setSelectedSchema] = useState('');

  const handleNext = () => {
    const schema = schemas.find(s => s.said === selectedSchema);
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

      <div className="space-y-3">
        {schemas.map((schema) => (
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
                <div className="font-medium">{schema.name}</div>
                <div className="text-sm text-gray-600 mb-2">{schema.description}</div>
                <div className="text-xs text-gray-400 break-all">SAID: {schema.said}</div>
              </div>
            </label>
          </div>
        ))}
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
          disabled={!selectedSchema}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const CreateCredentialStep: React.FC<StepProps> = ({ state, onNext, onBack, isLoading }) => {
  const { keriaService } = useKeriStore();
  const [credentialData, setCredentialData] = useState({
    eventName: '',
    accessLevel: 'attendee',
    validDate: ''
  });
  const [holderAid, setHolderAid] = useState(state.holderAid);
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!state.selectedAid || !state.registry || !state.schema || !holderAid || !keriaService) return;
    
    setLoading(true);
    try {
      const credentialService = createCredentialService(keriaService);
      
      const credential = await credentialService.issueCredential({
        issuerAlias: state.selectedAid,
        holderAid: holderAid,
        registryName: state.registry.name,
        schemaId: state.schema.said,
        attributes: credentialData
      });
      
      onNext({ credential, holderAid });
    } catch (error) {
      console.error('Failed to create credential:', error);
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

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Holder AID
          </label>
          <input
            type="text"
            value={holderAid}
            onChange={(e) => setHolderAid(e.target.value)}
            placeholder="Enter holder's AID"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Name
          </label>
          <input
            type="text"
            value={credentialData.eventName}
            onChange={(e) => setCredentialData(prev => ({ ...prev, eventName: e.target.value }))}
            placeholder="e.g., GLEIF Summit"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Access Level
          </label>
          <select
            value={credentialData.accessLevel}
            onChange={(e) => setCredentialData(prev => ({ ...prev, accessLevel: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="attendee">Attendee</option>
            <option value="speaker">Speaker</option>
            <option value="staff">Staff</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valid Date
          </label>
          <input
            type="date"
            value={credentialData.validDate}
            onChange={(e) => setCredentialData(prev => ({ ...prev, validDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
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
          disabled={loading || !holderAid || !credentialData.eventName || !credentialData.validDate}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Credential'}
        </button>
      </div>
    </div>
  );
};

const SendGrantStep: React.FC<StepProps> = ({ state, onNext, onBack, isLoading }) => {
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

const CompletionStep: React.FC<StepProps> = ({ state, onBack }) => {
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
  const [isLoading, setIsLoading] = useState(false);
  
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
    const stepProps = { state, onNext: handleNext, onBack: handleBack, isLoading };
    
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