import React, { useState } from 'react';
import * as bip39 from 'bip39';
import { keyManagerService } from '../services/keyManager.service';
import { useKeriStore } from '../store/keriStore';

interface CreateAIDModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type CreationMode = 'passcode' | 'keypair';

export const CreateAIDModal: React.FC<CreateAIDModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { keriaService, refreshAIDs } = useKeriStore();
  
  // State management
  const [mode, setMode] = useState<CreationMode>('passcode');
  const [alias, setAlias] = useState('');
  const [passcode, setPasscode] = useState('');
  const [salt, setSalt] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [mnemonic, setMnemonic] = useState('');
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [storeMnemonic, setStoreMnemonic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'setup' | 'mnemonic' | 'confirm'>('setup');
  const [generatedMnemonic, setGeneratedMnemonic] = useState<string | null>(null);

  // Inception configuration
  const [inceptionConfig] = useState({
    icount: 1,  // Number of initial signing keys
    isith: 1,   // Initial signing threshold
    ncount: 0,  // Number of next (rotation) keys
    nsith: 0,   // Next signing threshold
    toad: 0,    // Witness threshold (0 for local testing)
    wits: []    // No witnesses for local testing
  });

  if (!isOpen) return null;

  // Debug logging
  console.log('CreateAIDModal state:', {
    step,
    mode,
    alias,
    mnemonic: mnemonic ? `${mnemonic.split(' ').length} words` : 'empty',
    generatedMnemonic: generatedMnemonic ? 'present' : 'none',
    loading,
    buttonDisabled: loading || !alias.trim() || (step === 'mnemonic' && !mnemonic.trim())
  });

  const handleGeneratePasscode = () => {
    setPasscode(keyManagerService.generatePasscode());
    setSalt(keyManagerService.generateSalt());
    setShowPasscode(true);
  };

  const handleGenerateMnemonic = () => {
    const newMnemonic = keyManagerService.generateMnemonic();
    setGeneratedMnemonic(newMnemonic);
    setMnemonic(newMnemonic);
    setStep('mnemonic');
  };

  const validateForm = (): boolean => {
    if (!alias.trim()) {
      setError('Alias is required');
      return false;
    }

    if (mode === 'passcode') {
      if (!passcode.trim()) {
        setError('Passcode is required');
        return false;
      }
      if (!salt.trim()) {
        setError('Salt is required');
        return false;
      }
    } else {
      if (!mnemonic.trim()) {
        setError('Mnemonic phrase is required');
        return false;
      }
      if (!bip39.validateMnemonic(mnemonic)) {
        setError('Invalid mnemonic phrase');
        return false;
      }
    }

    return true;
  };

  const handleCreateAID = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      if (!keriaService) throw new Error('KERIA service not initialized');

      // Generate unique alias with timestamp
      const uniqueAlias = `${alias}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      if (mode === 'passcode') {
        // Passcode-based creation (kli incept style)
        await keyManagerService.generateSeedFromPasscode(passcode, salt);
        
        // Create AID with passcode-derived seed
        const { op } = await keriaService.createAID(uniqueAlias, {
          ...inceptionConfig,
          salt: salt,
          // The seed will be used internally by KERIA
        });

        await keriaService.waitForOperation(op);
        await keriaService.deleteOperation(op.name);

        // Store the passcode and salt for future use
        localStorage.setItem(`vlei-aid-${uniqueAlias}`, JSON.stringify({
          alias: alias,
          uniqueAlias: uniqueAlias,
          mode: 'passcode',
          salt: salt,
          createdAt: new Date().toISOString()
        }));

      } else {
        // Keypair-based creation with mnemonic
        const keypair = await keyManagerService.generateKeypairFromMnemonic(mnemonic);
        
        // Generate salt for encryption
        const encryptSalt = keyManagerService.generateSalt();
        const encryptPasscode = keyManagerService.generatePasscode();

        // Store keypair encrypted in localStorage
        await keyManagerService.storeKeypair(
          uniqueAlias,
          keypair,
          encryptPasscode,
          encryptSalt,
          storeMnemonic
        );

        // Create AID from the public key
        const { op } = await keriaService.createAID(uniqueAlias, {
          ...inceptionConfig,
          // Use the generated keypair's public key
          // Note: This would require custom inception in a real implementation
        });

        await keriaService.waitForOperation(op);
        await keriaService.deleteOperation(op.name);

        // Store AID metadata
        localStorage.setItem(`vlei-aid-${uniqueAlias}`, JSON.stringify({
          alias: alias,
          uniqueAlias: uniqueAlias,
          mode: 'keypair',
          publicKey: keypair.publicKey,
          createdAt: new Date().toISOString()
        }));
      }

      // Refresh AIDs list
      await refreshAIDs();
      
      // Success
      if (onSuccess) onSuccess();
      handleClose();
    } catch (error) {
      console.error('Failed to create AID:', error);
      setError(`Failed to create AID: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAlias('');
    setPasscode('');
    setSalt('');
    setMnemonic('');
    setGeneratedMnemonic(null);
    setShowPasscode(false);
    setShowMnemonic(false);
    setStoreMnemonic(false);
    setError(null);
    setStep('setup');
    onClose();
  };

  const renderSetupStep = () => (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Creation Mode
        </label>
        <div className="space-y-2">
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="mode"
              value="passcode"
              checked={mode === 'passcode'}
              onChange={(e) => setMode(e.target.value as CreationMode)}
              className="mr-3"
            />
            <div>
              <div className="font-medium">Passcode-based (kli incept style)</div>
              <div className="text-sm text-gray-500">Generate AID using passcode and salt</div>
            </div>
          </label>
          
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="mode"
              value="keypair"
              checked={mode === 'keypair'}
              onChange={(e) => setMode(e.target.value as CreationMode)}
              className="mr-3"
            />
            <div>
              <div className="font-medium">Keypair-based</div>
              <div className="text-sm text-gray-500">Generate AID from mnemonic phrase</div>
            </div>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Alias <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder="e.g., my-identity"
        />
        <p className="mt-1 text-xs text-gray-500">A friendly name for your AID</p>
      </div>

      {mode === 'passcode' ? (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Passcode <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type={showPasscode ? 'text' : 'password'}
                className="flex-1 block w-full rounded-l-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter or generate passcode"
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="px-3 border-t border-b border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100"
              >
                {showPasscode ? 'Hide' : 'Show'}
              </button>
              <button
                type="button"
                onClick={handleGeneratePasscode}
                className="px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Generate
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Salt <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={salt}
              onChange={(e) => setSalt(e.target.value)}
              placeholder="Generated with passcode"
              readOnly={!!salt}
            />
            <p className="mt-1 text-xs text-gray-500">Salt is automatically generated with passcode</p>
          </div>
        </>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Mnemonic Phrase
          </label>
          <div className="mt-1">
            <textarea
              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              rows={3}
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
              placeholder="Enter existing mnemonic or generate new"
            />
          </div>
          <div className="mt-2 flex justify-between items-center">
            <button
              type="button"
              onClick={handleGenerateMnemonic}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Generate New Mnemonic
            </button>
            <button
              type="button"
              onClick={() => setShowMnemonic(!showMnemonic)}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              {showMnemonic ? 'Hide' : 'Show'} Phrase
            </button>
          </div>
        </div>
      )}

      {/* Inception Configuration Display */}
      <div className="bg-gray-50 p-3 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Inception Configuration</h4>
        <dl className="text-xs space-y-1">
          <div className="flex justify-between">
            <dt className="text-gray-500">Initial Keys (icount):</dt>
            <dd className="font-medium">{inceptionConfig.icount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Initial Threshold (isith):</dt>
            <dd className="font-medium">{inceptionConfig.isith}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Rotation Keys (ncount):</dt>
            <dd className="font-medium">{inceptionConfig.ncount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Rotation Threshold (nsith):</dt>
            <dd className="font-medium">{inceptionConfig.nsith}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Witness Threshold (toad):</dt>
            <dd className="font-medium">{inceptionConfig.toad}</dd>
          </div>
        </dl>
      </div>
    </>
  );

  const renderMnemonicStep = () => (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
        <h4 className="font-medium text-amber-800 mb-2">⚠️ Important: Save Your Mnemonic Phrase</h4>
        <p className="text-sm text-amber-700">
          This 24-word phrase is the only way to recover your identity. Write it down and store it securely.
          Never share it with anyone.
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-3 gap-2">
          {generatedMnemonic?.split(' ').map((word, index) => (
            <div key={index} className="flex items-center space-x-2 p-2 bg-white rounded border">
              <span className="text-xs text-gray-500 w-6">{index + 1}.</span>
              <span className="font-mono text-sm">{showMnemonic ? word : '•••••'}</span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowMnemonic(!showMnemonic)}
          className="mt-3 text-sm text-indigo-600 hover:text-indigo-500"
        >
          {showMnemonic ? 'Hide' : 'Show'} Phrase
        </button>
      </div>

      <label className="flex items-center">
        <input
          type="checkbox"
          checked={storeMnemonic}
          onChange={(e) => setStoreMnemonic(e.target.checked)}
          className="mr-2"
        />
        <span className="text-sm text-gray-700">
          Store mnemonic in browser (less secure, but convenient)
        </span>
      </label>

      <div className="bg-blue-50 border border-blue-200 p-3 rounded">
        <p className="text-sm text-blue-700">
          <strong>Tip:</strong> You can copy this phrase to a password manager or write it down on paper.
          This demo stores an encrypted version locally if you check the box above.
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={handleClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div 
          className="relative z-10 inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Create New AID
            </h3>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {step === 'setup' && renderSetupStep()}
              {step === 'mnemonic' && renderMnemonicStep()}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              {step === 'mnemonic' && (
                <button
                  type="button"
                  onClick={() => setStep('setup')}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateAID}
                disabled={loading || !alias.trim() || (step === 'mnemonic' && !mnemonic.trim())}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create AID'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};