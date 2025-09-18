import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createIPEXService } from '../services/ipex.service';
import { wizardStateService, type HolderWizardState, type WizardStep } from '../services/wizardState.service';
import { useKeriStore } from '../store/keriStore';

interface StepProps {
  state: HolderWizardState;
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
                ? 'bg-green-500 text-white'
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

const SelectedAIDIndicator: React.FC<{ selectedAid: string; aids: any[] }> = ({ selectedAid, aids }) => {
  if (!selectedAid) return null;
  
  const aid = aids.find(a => a.name === selectedAid);
  
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
      <div className="flex items-center">
        <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <div>
          <span className="text-sm font-medium text-green-900">Selected Holder AID: </span>
          <span className="text-sm text-green-700 font-mono">{selectedAid}</span>
          {aid && (
            <div className="text-xs text-green-600 font-mono mt-1">{aid.i}</div>
          )}
        </div>
      </div>
    </div>
  );
};

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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Holder AID</h2>
        <p className="text-gray-600">Choose which of your AIDs will receive the credential</p>
      </div>

      {!isConnected ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Please connect to KERIA first.</p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="text-green-600 hover:text-green-800"
          >
            Go to Dashboard to connect
          </button>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : aids.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No AIDs found. You need to create an AID first.</p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="text-green-600 hover:text-green-800"
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
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const ConnectIssuerStep: React.FC<StepProps> = ({ state, onNext, onBack }) => {
  const { keriaService, aids } = useKeriStore();
  const [issuerOOBI, setIssuerOOBI] = useState(state.issuerOOBI);
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!issuerOOBI.trim() || !state.selectedAid || !keriaService) return;
    
    setLoading(true);
    try {
      await keriaService.resolveOOBI(issuerOOBI.trim(), 'issuer');
      
      // Extract issuer AID from OOBI
      const issuerAid = extractAIDFromOOBI(issuerOOBI.trim());
      
      onNext({ issuerOOBI: issuerOOBI.trim(), issuerAid });
    } catch (error) {
      console.error('Failed to resolve issuer OOBI:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractAIDFromOOBI = (oobi: string): string => {
    // Extract AID from OOBI URL format
    const match = oobi.match(/\/oobi\/([^\/]+)/);
    return match ? match[1] : '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect to Issuer</h2>
        <p className="text-gray-600">Resolve the issuer's OOBI to establish a secure connection</p>
      </div>

      <SelectedAIDIndicator selectedAid={state.selectedAid} aids={aids} />

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Issuer OOBI URL
          </label>
          <input
            type="text"
            value={issuerOOBI}
            onChange={(e) => setIssuerOOBI(e.target.value)}
            placeholder="http://witness-demo:5642/oobi/EHlIlnBBlmKA08zLU4RDuYCkVs1k7-Jqdavd52P2HQ5h/witness"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            The issuer should provide this OOBI URL to you via a secure channel
          </p>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-medium text-green-900 mb-2">What is OOBI?</h3>
        <p className="text-sm text-green-700">
          Out-of-Band Introduction (OOBI) allows you to securely discover and verify the issuer's identity. 
          This establishes trust before any credentials are exchanged.
        </p>
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
          disabled={loading || !issuerOOBI.trim()}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Connecting...' : 'Connect'}
        </button>
      </div>
    </div>
  );
};

const ReceiveGrantStep: React.FC<StepProps> = ({ state, onNext, onBack }) => {
  const { keriaService, aids } = useKeriStore();
  const [grants, setGrants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState<any>(null);

  useEffect(() => {
    if (state.selectedAid && keriaService) {
      checkForGrants();
    }
  }, [state.selectedAid, keriaService]);

  const checkForGrants = async () => {
    if (!state.selectedAid || !keriaService) return;
    
    setLoading(true);
    try {
      const ipexService = createIPEXService(keriaService);
      const messages = await ipexService.getReceivedMessages(state.selectedAid);
      
      const grantMessages = messages.filter(msg => msg.type === 'grant');
      setGrants(grantMessages);
    } catch (error) {
      console.error('Failed to check for grants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (selectedGrant) {
      onNext({ receivedGrants: grants, selectedGrant });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Receive Offers</h2>
        <p className="text-gray-600">Check for incoming credential offers from the issuer</p>
      </div>

      <SelectedAIDIndicator selectedAid={state.selectedAid} aids={aids} />

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          {grants.length} credential offer{grants.length !== 1 ? 's' : ''} found
        </span>
        <button
          onClick={checkForGrants}
          disabled={loading}
          className="px-4 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : grants.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m-2 0a1 1 0 01-1-1V9a1 1 0 011-1h2a1 1 0 011 1v3a1 1 0 01-1 1z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-2">No credential offers received yet</p>
          <p className="text-sm text-gray-400">Ask the issuer to send you a credential offer</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grants.map((grant) => (
            <div key={grant.said} className="border rounded-lg p-4">
              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="selectedGrant"
                  value={grant.said}
                  checked={selectedGrant?.said === grant.said}
                  onChange={() => setSelectedGrant(grant)}
                  className="mr-3 mt-1"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium">Credential Offer</div>
                    <span className="text-xs text-gray-500">{grant.timestamp}</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>From: {grant.sender}</div>
                    <div>Credential: {grant.credentialSaid}</div>
                    <div className="text-xs text-gray-400">SAID: {grant.said}</div>
                  </div>
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
          disabled={!selectedGrant}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const ReviewCredentialStep: React.FC<StepProps> = ({ state, onNext, onBack }) => {
  const { keriaService, aids } = useKeriStore();
  const [credentialDetails, setCredentialDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (state.selectedGrant && keriaService) {
      loadCredentialDetails();
    }
  }, [state.selectedGrant, keriaService]);

  const loadCredentialDetails = async () => {
    if (!state.selectedGrant || !keriaService) return;
    
    try {
      const ipexService = createIPEXService(keriaService);
      const credential = await ipexService.getCredentialBySaid(state.selectedGrant.credentialSaid);
      
      setCredentialDetails(credential);
    } catch (error) {
      console.error('Failed to load credential details:', error);
      // If we can't load the credential, we can't display it properly
      setCredentialDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    onNext({ credentialDetails });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Credential</h2>
        <p className="text-gray-600">Examine the offered credential details before accepting</p>
      </div>

      <SelectedAIDIndicator selectedAid={state.selectedAid} aids={aids} />

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : credentialDetails ? (
        <div className="space-y-4">
          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Credential Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Issuer:</span>
                <div className="font-mono break-all">{credentialDetails.i}</div>
              </div>
              <div>
                <span className="text-gray-500">Credential SAID:</span>
                <div className="font-mono break-all">{credentialDetails.d}</div>
              </div>
              <div>
                <span className="text-gray-500">Schema SAID:</span>
                <div className="font-mono break-all">{credentialDetails.s}</div>
              </div>
              <div>
                <span className="text-gray-500">Version:</span>
                <div>{credentialDetails.v}</div>
              </div>
            </div>
          </div>

          {credentialDetails.a && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-3">Credential Attributes</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(credentialDetails.a).map(([key, value]) => {
                  if (key === 'd' || key === 'i') return null; // Skip internal fields
                  return (
                    <div key={key} className="flex justify-between">
                      <span className="text-green-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="text-green-800 font-medium">{String(value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-medium text-amber-900 mb-2">Security Check</h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>✓ Issuer identity verified via OOBI</li>
              <li>✓ Credential signature will be verified on accept</li>
              <li>✓ Schema structure validated</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-red-500">Failed to load credential details</p>
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
          disabled={loading || !credentialDetails}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          Accept & Continue
        </button>
      </div>
    </div>
  );
};

const AdmitCredentialStep: React.FC<StepProps> = ({ state, onNext, onBack }) => {
  const { keriaService, aids } = useKeriStore();
  const [loading, setLoading] = useState(false);

  const handleAdmit = async () => {
    if (!state.selectedAid || !state.selectedGrant || !state.issuerAid || !keriaService) return;
    
    setLoading(true);
    try {
      const ipexService = createIPEXService(keriaService);
      
      const result = await ipexService.admitGrant(
        state.selectedAid,
        state.selectedGrant.said,
        state.issuerAid
      );
      
      onNext({ admittedCredential: result });
    } catch (error) {
      console.error('Failed to admit credential:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Accept Credential</h2>
        <p className="text-gray-600">Admit the credential to your wallet and send confirmation to issuer</p>
      </div>

      <SelectedAIDIndicator selectedAid={state.selectedAid} aids={aids} />

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-medium text-green-900 mb-2">Final Step</h3>
        <p className="text-sm text-green-700">
          By clicking "Accept Credential", you will:
        </p>
        <ul className="text-sm text-green-700 mt-2 space-y-1">
          <li>• Verify the credential's cryptographic integrity</li>
          <li>• Store the credential securely in your wallet</li>
          <li>• Send an admit message to the issuer confirming receipt</li>
        </ul>
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-800"
        >
          Back
        </button>
        <button
          onClick={handleAdmit}
          disabled={loading}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Accepting...' : 'Accept Credential'}
        </button>
      </div>
    </div>
  );
};

const CompletionStep: React.FC<StepProps> = ({ state }) => {
  const navigate = useNavigate();
  const { aids } = useKeriStore();
  const nextSteps = wizardStateService.generateNextStepsForIssuer(state);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Credential Received Successfully!</h2>
        <p className="text-gray-600">The credential has been admitted to your wallet</p>
      </div>

      <SelectedAIDIndicator selectedAid={state.selectedAid} aids={aids} />

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-medium text-green-900 mb-2">Credential Details</h3>
        <div className="text-sm text-green-700 space-y-1">
          <div>Admit SAID: {state.admittedCredential?.admitSaid}</div>
          <div>Credential SAID: {state.selectedGrant?.credentialSaid}</div>
          <div>Issuer: {state.issuerAid}</div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Next Steps for Issuer</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          {nextSteps.map((step, index) => (
            <li key={index}>• {step}</li>
          ))}
        </ul>
      </div>

      <div className="bg-gray-50 border rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">What's Next?</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Your credential is now stored securely in your wallet</li>
          <li>• You can view it in the Dashboard under "Credentials"</li>
          <li>• You can present this credential to verifiers when needed</li>
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
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export const HolderWizard: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<HolderWizardState>(wizardStateService.getHolderState());
  const [isLoading, setIsLoading] = useState(false);
  
  const steps = wizardStateService.getHolderSteps();

  const handleNext = (stepData: any) => {
    const newState = { ...state, ...stepData, currentStep: state.currentStep + 1 };
    setState(newState);
    wizardStateService.saveHolderState(newState);
  };

  const handleBack = () => {
    if (state.currentStep > 0) {
      const newState = { ...state, currentStep: state.currentStep - 1 };
      setState(newState);
      wizardStateService.saveHolderState(newState);
    } else {
      navigate('/wizard');
    }
  };

  const renderCurrentStep = () => {
    const stepProps = { state, onNext: handleNext, onBack: handleBack, isLoading };
    
    switch (state.currentStep) {
      case 0: return <SelectAIDStep {...stepProps} />;
      case 1: return <ConnectIssuerStep {...stepProps} />;
      case 2: return <ReceiveGrantStep {...stepProps} />;
      case 3: return <ReviewCredentialStep {...stepProps} />;
      case 4: return <AdmitCredentialStep {...stepProps} />;
      case 5: return <CompletionStep {...stepProps} />;
      default: return <SelectAIDStep {...stepProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Holder Wizard</h1>
            <p className="text-gray-600 mt-2">Receive and manage VLEI credentials step by step</p>
          </div>
          
          <StepIndicator steps={steps} currentStep={state.currentStep} />
          
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
};