// Test utility to verify BIP39 functionality
import * as bip39 from 'bip39';
import { Buffer } from 'buffer';

// Ensure Buffer is globally available
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

export const testMnemonicGeneration = () => {
  try {
    console.log('Testing mnemonic generation...');
    
    // Generate entropy for 24-word mnemonic (256 bits)
    const entropy = crypto.getRandomValues(new Uint8Array(32));
    const entropyHex = Array.from(entropy)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    console.log('Generated entropy:', entropyHex);
    
    // Generate mnemonic
    const mnemonic = bip39.entropyToMnemonic(entropyHex);
    console.log('Generated mnemonic:', mnemonic);
    console.log('Mnemonic word count:', mnemonic.split(' ').length);
    
    // Validate mnemonic
    const isValid = bip39.validateMnemonic(mnemonic);
    console.log('Mnemonic is valid:', isValid);
    
    return {
      success: true,
      mnemonic,
      isValid,
      wordCount: mnemonic.split(' ').length
    };
  } catch (error) {
    console.error('Mnemonic generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Test function that can be called from browser console
(window as any).testBip39 = testMnemonicGeneration;