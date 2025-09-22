import { treaty } from '@elysiajs/eden';
import type { oobiRoutes } from './index';
import type { ResolveOOBIRequest, ResolveOOBIResponse } from './types';

// Type for the combined routes
type OobiApi = typeof oobiRoutes;

export class OOBIClient {
  private client: ReturnType<typeof treaty<OobiApi>>;

  constructor(url: string) {
    this.client = treaty<OobiApi>(url);
  }

  // OOBI operations
  async resolveOOBI(request: ResolveOOBIRequest, timeoutMs?: number): Promise<{ response: ResolveOOBIResponse }> {
    const headers: Record<string, string> = {};
    if (timeoutMs) {
      headers['x-timeout'] = timeoutMs.toString();
    }

    const response = await this.client.oobi.resolve.post(request, { headers });

    if (response.error) {
      throw new Error(`Failed to resolve OOBI: ${response.error.value}`);
    }

    return response.data;
  }
}

// Factory function to create client
export const oobiClient = (url: string = 'http://localhost:3001'): OOBIClient => {
  return new OOBIClient(url);
};