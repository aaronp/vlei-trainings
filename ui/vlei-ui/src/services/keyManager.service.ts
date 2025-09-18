import '../utils/polyfills'; // Ensure Buffer is available
import * as bip39 from 'bip39';
import { blake3 } from '@noble/hashes/blake3';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
  mnemonic?: string;
}

export interface StoredKeyPair {
  alias: string;
  publicKey: string;
  encryptedPrivateKey: string;
  salt: string;
  mnemonic?: string; // Only stored if user explicitly allows
  createdAt: string;
}

export class KeyManagerService {
  private readonly STORAGE_KEY = 'vlei-keypairs';
  private readonly PBKDF2_ITERATIONS = 100000;

  // Generate a new random salt
  generateSalt(): string {
    // Generate 16 random bytes and encode as base64url
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    return this.base64UrlEncode(saltBytes);
  }

  // Generate a secure passcode
  generatePasscode(): string {
    // Generate 16 random bytes and encode as base64url for a secure passcode
    const passcodeBytes = crypto.getRandomValues(new Uint8Array(16));
    return this.base64UrlEncode(passcodeBytes);
  }

  // Generate a mnemonic phrase (24 words)
  generateMnemonic(): string {
    // Generate 256 bits of entropy for 24-word mnemonic
    const entropy = crypto.getRandomValues(new Uint8Array(32));
    // Convert to hex string for bip39
    const entropyHex = Array.from(entropy)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return bip39.entropyToMnemonic(entropyHex);
  }

  // Generate keypair from mnemonic
  async generateKeypairFromMnemonic(mnemonic: string): Promise<KeyPair> {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    // Convert mnemonic to seed
    const seed = await bip39.mnemonicToSeed(mnemonic);
    
    // Use first 32 bytes of seed for private key
    const privateKeyBytes = seed.slice(0, 32);
    
    // For now, we'll use the seed directly as the private key
    // In a real implementation, we'd derive the Ed25519 keypair from the seed
    
    return {
      publicKey: this.base64UrlEncode(privateKeyBytes), // Placeholder - would need proper Ed25519 derivation
      privateKey: this.base64UrlEncode(privateKeyBytes),
      mnemonic
    };
  }

  // Generate a random keypair
  async generateRandomKeypair(): Promise<KeyPair> {
    const mnemonic = this.generateMnemonic();
    return this.generateKeypairFromMnemonic(mnemonic);
  }

  // Encrypt private key with passcode
  async encryptPrivateKey(privateKey: string, passcode: string, salt: string): Promise<string> {
    // Derive key from passcode using PBKDF2
    const encoder = new TextEncoder();
    const passcodeBuffer = encoder.encode(passcode);
    const saltBuffer = encoder.encode(salt);
    
    // Import passcode as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passcodeBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive AES key
    const aesKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: this.PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt private key
    const privateKeyBuffer = encoder.encode(privateKey);
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      privateKeyBuffer
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    return this.base64UrlEncode(combined);
  }

  // Decrypt private key with passcode
  async decryptPrivateKey(encryptedPrivateKey: string, passcode: string, salt: string): Promise<string> {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    // Decode encrypted data
    const combined = this.base64UrlDecode(encryptedPrivateKey);
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    // Derive key from passcode
    const passcodeBuffer = encoder.encode(passcode);
    const saltBuffer = encoder.encode(salt);
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passcodeBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const aesKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: this.PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      encryptedData
    );

    return decoder.decode(decryptedBuffer);
  }

  // Store keypair in localStorage
  async storeKeypair(
    alias: string,
    keypair: KeyPair,
    passcode: string,
    salt: string,
    storeMnemonic: boolean = false
  ): Promise<void> {
    const encryptedPrivateKey = await this.encryptPrivateKey(keypair.privateKey, passcode, salt);
    
    const storedKeypair: StoredKeyPair = {
      alias,
      publicKey: keypair.publicKey,
      encryptedPrivateKey,
      salt,
      mnemonic: storeMnemonic ? keypair.mnemonic : undefined,
      createdAt: new Date().toISOString()
    };

    // Get existing keypairs
    const keypairs = this.getStoredKeypairs();
    
    // Check if alias already exists
    if (keypairs.some(kp => kp.alias === alias)) {
      throw new Error(`Keypair with alias "${alias}" already exists`);
    }

    // Add new keypair
    keypairs.push(storedKeypair);
    
    // Store in localStorage
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keypairs));
  }

  // Get all stored keypairs
  getStoredKeypairs(): StoredKeyPair[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  // Get a specific keypair
  getKeypair(alias: string): StoredKeyPair | null {
    const keypairs = this.getStoredKeypairs();
    return keypairs.find(kp => kp.alias === alias) || null;
  }

  // Delete a keypair
  deleteKeypair(alias: string): void {
    const keypairs = this.getStoredKeypairs();
    const filtered = keypairs.filter(kp => kp.alias !== alias);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }

  // Helper functions
  private base64UrlEncode(buffer: Uint8Array): string {
    const base64 = btoa(String.fromCharCode(...buffer));
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private base64UrlDecode(str: string): Uint8Array {
    // Add padding if necessary
    const padding = '='.repeat((4 - (str.length % 4)) % 4);
    const base64 = str
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      + padding;
    
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  }

  // Generate a deterministic seed from passcode and salt (for kli incept compatibility)
  async generateSeedFromPasscode(passcode: string, salt: string): Promise<string> {
    // This mimics what kli does with passcode and salt
    const encoder = new TextEncoder();
    const passcodeBytes = encoder.encode(passcode);
    const saltBytes = encoder.encode(salt);
    
    // Combine passcode and salt
    const combined = new Uint8Array(passcodeBytes.length + saltBytes.length);
    combined.set(passcodeBytes, 0);
    combined.set(saltBytes, passcodeBytes.length);
    
    // Hash with Blake3 to get seed
    const seed = blake3(combined);
    
    // Return first 32 bytes as base64url
    return this.base64UrlEncode(seed.slice(0, 32));
  }
}

export const keyManagerService = new KeyManagerService();