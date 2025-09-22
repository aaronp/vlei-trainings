import { treaty } from '@elysiajs/eden';
import type { Elysia } from 'elysia';
import type { aidsRoutes, oobiRoutes } from './index';
import type { AID, CreateAIDRequest, RotateAIDRequest, OOBIResolveRequest } from './types';

// Type for the combined routes
type AidApi = typeof aidsRoutes & typeof oobiRoutes;

export class AIDClient {
  private client: ReturnType<typeof treaty<AidApi>>;

  constructor(url: string) {
    this.client = treaty<AidApi>(url);
  }

  // AID operations
  async createAID(request: CreateAIDRequest): Promise<{ aid: AID }> {
    const response = await this.client.aids.post(request);
    
    if (response.error) {
      throw new Error(`Failed to create AID: ${response.error.value}`);
    }
    
    return response.data;
  }

  async listAIDs(): Promise<{ aids: AID[] }> {
    const response = await this.client.aids.get();
    
    if (response.error) {
      throw new Error(`Failed to list AIDs: ${response.error.value}`);
    }
    
    return response.data;
  }

  async getAID(prefix: string): Promise<{ aid: AID }> {
    const response = await this.client.aids[prefix].get();
    
    if (response.error) {
      throw new Error(`Failed to get AID: ${response.error.value}`);
    }
    
    return response.data;
  }

  async rotateAID(prefix: string, request: RotateAIDRequest): Promise<{ message: string; aid: AID }> {
    const response = await this.client.aids[prefix].rotate.post(request);
    
    if (response.error) {
      throw new Error(`Failed to rotate AID: ${response.error.value}`);
    }
    
    return response.data;
  }

  // OOBI operations
  async resolveOOBI(request: OOBIResolveRequest): Promise<{ message: string; oobi: string }> {
    const response = await this.client.oobis.resolve.post(request);
    
    if (response.error) {
      throw new Error(`Failed to resolve OOBI: ${response.error.value}`);
    }
    
    return response.data;
  }
}

// Factory function to create client
export const aidClient = (url: string = 'http://localhost:3001'): AIDClient => {
  return new AIDClient(url);
};