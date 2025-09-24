import { treaty } from '@elysiajs/eden';
import type { aidsRoutes } from './index';
import type { AID, CreateAIDRequest, SignRequest, VerifyRequest, RotateRequest } from './types';

// Type for the combined routes
type AidApi = typeof aidsRoutes;

export class AIDClient {
  private client: ReturnType<typeof treaty<AidApi>>;
  private bran?: string;

  constructor(url: string, bran?: string) {
    this.client = treaty<AidApi>(url);
    this.bran = bran;
  }

  // Update the bran (useful after receiving it from response headers)
  setBran(bran: string) {
    this.bran = bran;
  }

  // Get the current bran
  getBran(): string | undefined {
    return this.bran;
  }

  // AID operations
  async createAID(request: CreateAIDRequest): Promise<{ aid: AID; bran?: string }> {
    const headers: Record<string, string> = {};
    if (this.bran) {
      headers['x-keria-bran'] = this.bran;
    }

    const response = await this.client.aids.post(request, { headers });

    if (response.error) {
      throw new Error(`Failed to create AID: ${response.error.value}`);
    }

    // Extract bran from response headers if present
    const responseBran = response.headers?.['x-keria-bran'];
    if (responseBran) {
      this.bran = responseBran; // Update stored bran
    }

    return {
      ...response.data,
      bran: responseBran
    };
  }

  // Sign a message
  async signMessage(request: SignRequest): Promise<{ signature: string; bran?: string }> {
    const headers: Record<string, string> = {};
    if (this.bran) {
      headers['x-keria-bran'] = this.bran;
    }

    const response = await this.client.aids.sign.post(request, { headers });

    if (response.error) {
      throw new Error(`Failed to sign message: ${response.error.value}`);
    }

    // Extract bran from response headers if present
    const responseBran = response.headers?.['x-keria-bran'];
    if (responseBran) {
      this.bran = responseBran; // Update stored bran
    }

    return {
      ...response.data,
      bran: responseBran
    };
  }

  // Verify a signature
  async verifySignature(request: VerifyRequest): Promise<{ valid: boolean; prefix: string; bran?: string }> {
    const headers: Record<string, string> = {};
    if (this.bran) {
      headers['x-keria-bran'] = this.bran;
    }

    const response = await this.client.aids.verify.post(request, { headers });

    if (response.error) {
      throw new Error(`Failed to verify signature: ${response.error.value}`);
    }

    // Extract bran from response headers if present
    const responseBran = response.headers?.['x-keria-bran'];
    if (responseBran) {
      this.bran = responseBran; // Update stored bran
    }

    return {
      ...response.data,
      bran: responseBran
    };
  }

  // Rotate AID keys
  async rotateKeys(request: RotateRequest): Promise<{ prefix: string; alias: string; sequence: number; publicKey: string; bran?: string }> {
    const headers: Record<string, string> = {};
    if (this.bran) {
      headers['x-keria-bran'] = this.bran;
    }

    const response = await this.client.aids['rotate-key'].post(request, { headers });

    if (response.error) {
      throw new Error(`Failed to rotate keys: ${response.error.value}`);
    }

    // Extract bran from response headers if present
    const responseBran = response.headers?.['x-keria-bran'];
    if (responseBran) {
      this.bran = responseBran; // Update stored bran
    }

    return {
      ...response.data,
      bran: responseBran
    };
  }

}

// Factory function to create client
export const aidClient = (url: string = 'http://localhost:3001', bran?: string): AIDClient => {
  return new AIDClient(url, bran);
};