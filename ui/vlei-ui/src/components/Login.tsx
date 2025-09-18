import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { randomPasscode } from 'signify-ts';
import { useKeriStore } from '../store/keriStore';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { initialize, bootstrap, connect, isInitialized, passcode: storedPasscode } = useKeriStore();
  
  const [adminUrl, setAdminUrl] = useState('http://localhost:3901');
  const [bootUrl, setBootUrl] = useState('http://localhost:3903');
  const [passcode, setPasscode] = useState(storedPasscode || '');
  const [isNewAgent, setIsNewAgent] = useState(!storedPasscode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateNewPasscode = () => {
    const newPasscode = randomPasscode();
    setPasscode(newPasscode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Initialize KERIA service
      await initialize(adminUrl, bootUrl, passcode);

      if (isNewAgent) {
        // Bootstrap new agent
        await bootstrap();
      } else {
        // Connect to existing agent
        await connect();
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to KERIA');
      console.error('Connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            VLEI Issuance System
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connect to your KERIA agent
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="admin-url" className="sr-only">
                Admin URL
              </label>
              <input
                id="admin-url"
                name="adminUrl"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Admin URL (e.g., http://localhost:3901)"
                value={adminUrl}
                onChange={(e) => setAdminUrl(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="boot-url" className="sr-only">
                Boot URL
              </label>
              <input
                id="boot-url"
                name="bootUrl"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Boot URL (e.g., http://localhost:3903)"
                value={bootUrl}
                onChange={(e) => setBootUrl(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="passcode" className="sr-only">
                Passcode
              </label>
              <div className="flex">
                <input
                  id="passcode"
                  name="passcode"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-bl-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="21-character passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  disabled={loading}
                  maxLength={21}
                  minLength={21}
                />
                <button
                  type="button"
                  onClick={generateNewPasscode}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-br-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={loading}
                >
                  Generate
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="new-agent"
                name="newAgent"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={isNewAgent}
                onChange={(e) => setIsNewAgent(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="new-agent" className="ml-2 block text-sm text-gray-900">
                Create new agent
              </label>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || !passcode || passcode.length !== 21}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connecting...' : (isNewAgent ? 'Bootstrap Agent' : 'Connect to Agent')}
            </button>
          </div>

          <div className="text-center">
            <p className="mt-2 text-sm text-gray-600">
              {isNewAgent 
                ? 'This will create a new KERIA agent with the provided passcode.'
                : 'Connect to an existing KERIA agent using your saved passcode.'}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};