import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Wizard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            VLEI Issuance Wizard
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Learn the complete process of issuing and receiving Verifiable Legal Entity Identifiers (vLEIs) 
            using the KERI protocol and IPEX exchange system.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Issuer Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-blue-600 px-6 py-4">
              <h2 className="text-2xl font-bold text-white">Issuer Wizard</h2>
              <p className="text-blue-100 mt-1">Create and issue credentials</p>
            </div>
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Setup Registry</h3>
                    <p className="text-sm text-gray-500">Create a credential registry for your organization</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Choose Schema</h3>
                    <p className="text-sm text-gray-500">Select credential type and validation rules</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Issue Credential</h3>
                    <p className="text-sm text-gray-500">Create and send credential to holder</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">4</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Send via IPEX</h3>
                    <p className="text-sm text-gray-500">Transmit using secure KERI messaging</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-900 mb-2">You'll Learn:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Credential registry management</li>
                  <li>• Schema selection and validation</li>
                  <li>• ACDC creation process</li>
                  <li>• IPEX grant messaging</li>
                </ul>
              </div>

              <button
                onClick={() => navigate('/wizard/issuer')}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Start as Issuer
              </button>
            </div>
          </div>

          {/* Holder Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-green-600 px-6 py-4">
              <h2 className="text-2xl font-bold text-white">Holder Wizard</h2>
              <p className="text-green-100 mt-1">Receive and manage credentials</p>
            </div>
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-green-600">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Connect to Issuer</h3>
                    <p className="text-sm text-gray-500">Establish secure connection via OOBI</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-green-600">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Receive Offer</h3>
                    <p className="text-sm text-gray-500">Get credential offer via IPEX messaging</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-green-600">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Review Credential</h3>
                    <p className="text-sm text-gray-500">Verify issuer and credential contents</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-green-600">4</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Accept & Store</h3>
                    <p className="text-sm text-gray-500">Admit credential to your wallet</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-green-900 mb-2">You'll Learn:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• OOBI resolution and trust</li>
                  <li>• IPEX message handling</li>
                  <li>• Credential verification</li>
                  <li>• Secure credential storage</li>
                </ul>
              </div>

              <button
                onClick={() => navigate('/wizard/holder')}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Start as Holder
              </button>
            </div>
          </div>
        </div>

        {/* Coordination Section */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Coordinating Between Parties
            </h2>
            <p className="text-gray-600">
              For the complete VLEI issuance process, you'll need coordination between issuer and holder
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">1. Share OOBIs</h3>
              <p className="text-sm text-gray-500">Exchange Out-of-Band Introductions to establish trust</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">2. Issue Credential</h3>
              <p className="text-sm text-gray-500">Issuer creates and sends credential via IPEX</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">3. Accept & Verify</h3>
              <p className="text-sm text-gray-500">Holder reviews and admits credential to wallet</p>
            </div>
          </div>

          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="flex-shrink-0 w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-medium text-amber-900">Coordination Tips</h4>
                <ul className="mt-2 text-sm text-amber-700 space-y-1">
                  <li>• Both parties need their own AIDs created first</li>
                  <li>• Exchange OOBIs outside the wizard (email, QR codes, etc.)</li>
                  <li>• Each wizard will show the next steps for the other party</li>
                  <li>• Use different browser sessions or devices for testing both roles</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};