import { treaty } from '@elysiajs/eden';
import type { aidsRoutes } from './index';
import type { AID, CreateAIDRequest } from './types';

// Type for the combined routes
type AidApi = typeof aidsRoutes;

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

}

// Factory function to create client
export const aidClient = (url: string = 'http://localhost:3001'): AIDClient => {
  return new AIDClient(url);
};