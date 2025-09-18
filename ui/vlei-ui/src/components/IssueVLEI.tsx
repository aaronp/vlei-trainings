import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeriStore } from '../store/keriStore';

// GLEIF VLEI Schema SAID (you'll need to replace this with the actual VLEI schema SAID)
const VLEI_SCHEMA_SAID = 'EGUPiCVO73M9worPwR3PfThAtC0AJnH5ZgwsXf6TzbVK';
const SCHEMA_SERVER_OOBI = `http://localhost:7723/oobi/${VLEI_SCHEMA_SAID}`;

export const IssueVLEI: React.FC = () => {
  const navigate = useNavigate();
  const { keriaService, credentialService, aids, isConnected } = useKeriStore();

  const [selectedIssuer, setSelectedIssuer] = useState('');
  const [recipientAid, setRecipientAid] = useState('');
  const [registry, setRegistry] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'setup' | 'form' | 'complete'>('setup');
  
  // VLEI form data
  const [vleiData, setVleiData] = useState({
    lei: '',
    entityName: '',
    entityType: 'Legal Entity',
    registrationDate: new Date().toISOString().split('T')[0],
    status: 'Active'
  });

  useEffect(() => {
    if (!isConnected) {
      navigate('/');
    }
  }, [isConnected, navigate]);

  const handleSetupRegistry = async () => {
    if (!selectedIssuer || !keriaService || !credentialService) return;

    setLoading(true);
    try {
      // First check if registry exists
      const registries = await credentialService.listRegistries(selectedIssuer);
      
      let existingRegistry = registries.find(r => r.name === 'vleiRegistry');
      
      if (!existingRegistry) {
        // Create new registry
        existingRegistry = await credentialService.createRegistry(selectedIssuer, 'vleiRegistry');
      }
      
      setRegistry(existingRegistry);

      // Resolve schema OOBI
      try {
        const resolveOp = await keriaService.resolveOOBI(SCHEMA_SERVER_OOBI, 'vleiSchema');
        await keriaService.waitForOperation(resolveOp);
        await keriaService.deleteOperation(resolveOp.name);
      } catch (oobiError) {
        console.warn('VLEI Schema OOBI resolution failed:', oobiError);
        // Continue anyway - the schema might already be resolved
      }

      setStep('form');
    } catch (error) {
      console.error('Failed to setup registry:', error);
      alert('Failed to setup registry: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueVLEI = async () => {
    if (!credentialService || !registry) return;

    setLoading(true);
    try {
      // Issue the VLEI credential
      const { credential, operation } = await credentialService.issueVLEI(
        selectedIssuer,
        registry.regk,
        VLEI_SCHEMA_SAID,
        recipientAid,
        vleiData
      );

      // Clean up operation
      await keriaService?.deleteOperation(operation.name);

      // If recipient is one of our AIDs, grant it to them
      const isOurAid = aids.some(aid => aid.i === recipientAid);
      if (isOurAid) {
        await credentialService.grantCredential(selectedIssuer, credential, recipientAid);
      }

      setStep('complete');
    } catch (error) {
      console.error('Failed to issue VLEI:', error);
      alert('Failed to issue VLEI: ' + (error as Error).message);
    } finally {
      setLoading(false);
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
                  VLEI Issued Successfully!
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  The verifiable LEI credential has been created and issued.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Back to Dashboard
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
      <div className="max-w-2xl mx-auto">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Issue VLEI Credential
            </h3>
          </div>

          {step === 'setup' ? (
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
                      onClick={() => navigate('/dashboard')}
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
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
          ) : (
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Recipient AID
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={recipientAid}
                    onChange={(e) => setRecipientAid(e.target.value)}
                    placeholder="Enter recipient's AID prefix"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    LEI
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={vleiData.lei}
                    onChange={(e) => setVleiData({ ...vleiData, lei: e.target.value })}
                    placeholder="20-character LEI"
                    maxLength={20}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Legal Entity Name
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={vleiData.entityName}
                    onChange={(e) => setVleiData({ ...vleiData, entityName: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Entity Type
                  </label>
                  <select
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={vleiData.entityType}
                    onChange={(e) => setVleiData({ ...vleiData, entityType: e.target.value })}
                    disabled={loading}
                  >
                    <option>Legal Entity</option>
                    <option>Fund</option>
                    <option>Government Entity</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Registration Date
                  </label>
                  <input
                    type="date"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={vleiData.registrationDate}
                    onChange={(e) => setVleiData({ ...vleiData, registrationDate: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={vleiData.status}
                    onChange={(e) => setVleiData({ ...vleiData, status: e.target.value })}
                    disabled={loading}
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>

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
                      onClick={handleIssueVLEI}
                      disabled={loading || !recipientAid || !vleiData.lei || !vleiData.entityName}
                      className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {loading ? 'Issuing...' : 'Issue VLEI'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};