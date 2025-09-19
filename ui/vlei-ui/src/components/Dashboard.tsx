import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeriStore } from '../store/keriStore';
import { CreateAIDModal } from './CreateAIDModal';
import { ConnectionGuard } from './ConnectionGuard';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    clientState,
    aids,
    credentials,
    isConnected,
    refreshAIDs,
    refreshCredentials,
    disconnect,
    clearStore
  } = useKeriStore();

  const [showCreateAid, setShowCreateAid] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');


  useEffect(() => {
    if (isConnected) {
      refreshAIDs();
      refreshCredentials();
    }
  }, [isConnected, refreshAIDs, refreshCredentials]);

  const handleCreateAIDSuccess = () => {
    setSuccessMessage('Successfully created new AID');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleLogout = () => {
    disconnect();
    clearStore();
    navigate('/');
  };

  if (!clientState) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ConnectionGuard>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold">VLEI Dashboard</h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/wizard')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  VLEI Wizard
                </button>
                <button
                  onClick={() => navigate('/issue')}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  Issue VLEI
                </button>
                <button
                  onClick={() => navigate('/issue-credential')}
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                >
                  Issue Credential
                </button>
                <button
                  onClick={() => navigate('/organizations')}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700"
                >
                  Organizations
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
          <CreateAIDModal
            isOpen={showCreateAid}
            onClose={() => setShowCreateAid(false)}
            onSuccess={handleCreateAIDSuccess}
          />
        </main>
      </div>
    </ConnectionGuard>
  );
};