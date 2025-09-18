import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeriStore } from '../store/keriStore';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { 
    clientState, 
    aids, 
    credentials, 
    isConnected,
    refreshAIDs,
    refreshCredentials,
    createAID,
    disconnect,
    clearStore
  } = useKeriStore();

  const [loading, setLoading] = useState(false);
  const [newAidAlias, setNewAidAlias] = useState('');
  const [showCreateAid, setShowCreateAid] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Debug state
  console.log('Dashboard state:', { loading, newAidAlias, showCreateAid, aids });

  useEffect(() => {
    if (!isConnected) {
      navigate('/');
    }
  }, [isConnected, navigate]);

  useEffect(() => {
    if (isConnected) {
      refreshAIDs();
      refreshCredentials();
    }
  }, [isConnected]);

  const handleCreateAID = async () => {
    if (!newAidAlias) return;
    
    setLoading(true);
    try {
      await createAID(newAidAlias);
      setNewAidAlias('');
      setShowCreateAid(false);
      await refreshAIDs();
      
      // Show success message
      setSuccessMessage(`Successfully created AID "${newAidAlias}"`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('Failed to create AID:', error);
      
      // Parse error message for better user feedback
      let errorMessage = 'Failed to create AID';
      if (error.message?.includes('already incepted')) {
        errorMessage = `An AID with the name "${newAidAlias}" already exists. Please choose a different name.`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    disconnect();
    clearStore();
    navigate('/');
  };

  if (!clientState) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">VLEI Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/issue')}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Issue VLEI
              </button>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded relative">
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}
        {/* Client Information */}
        <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Client Information
            </h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Client AID</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-mono">
                  {clientState.controller.state.i}
                </dd>
              </div>
              <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Agent AID</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-mono">
                  {clientState.agent.i}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* AIDs */}
        <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Managed AIDs
            </h3>
            <button
              onClick={() => setShowCreateAid(true)}
              className="bg-indigo-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-indigo-700"
            >
              Create AID
            </button>
          </div>
          <div className="border-t border-gray-200">
            {aids.length === 0 ? (
              <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
                No AIDs created yet
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {aids.map((aid) => (
                  <li key={aid.name} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{aid.name}</p>
                        <p className="text-sm text-gray-500 font-mono">{aid.i}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Credentials */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Credentials
            </h3>
          </div>
          <div className="border-t border-gray-200">
            {credentials.length === 0 ? (
              <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
                No credentials yet
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {credentials.map((cred, idx) => (
                  <li key={idx} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {cred.sad?.a?.entityName || 'Unknown Entity'}
                        </p>
                        <p className="text-sm text-gray-500">
                          LEI: {cred.sad?.a?.lei || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Create AID Modal */}
        {showCreateAid && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity" 
                aria-hidden="true"
                onClick={() => {
                  setShowCreateAid(false);
                  setNewAidAlias('');
                }}
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 relative z-20">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Create New AID
                  </h3>
                  <div className="mt-2">
                    <input
                      type="text"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Enter AID alias (e.g., my-aid)"
                      value={newAidAlias}
                      onChange={(e) => setNewAidAlias(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newAidAlias.trim() && !loading) {
                          handleCreateAID();
                        } else if (e.key === 'Escape') {
                          setShowCreateAid(false);
                          setNewAidAlias('');
                        }
                      }}
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    onClick={handleCreateAID}
                    disabled={loading || !newAidAlias.trim()}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateAid(false);
                      setNewAidAlias('');
                    }}
                    disabled={loading}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};