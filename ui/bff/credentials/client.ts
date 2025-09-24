import { treaty } from '@elysiajs/eden';
import type { credentialsRoutes } from './index';
import type { IssueCredentialRequest, IssueCredentialResponse } from './types';

// Type for the combined routes
type CredentialsApi = typeof credentialsRoutes;

export class CredentialsClient {
  private client: ReturnType<typeof treaty<CredentialsApi>>;
  private bran?: string;

  constructor(url: string, bran?: string) {
    this.client = treaty<CredentialsApi>(url);
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

  // Issue credential
  async issueCredential(request: IssueCredentialRequest): Promise<IssueCredentialResponse & { bran?: string }> {
    const headers: Record<string, string> = {};
    if (this.bran) {
      headers['x-keria-bran'] = this.bran;
    }

    const response = await this.client.credentials.issue.post(request, { headers });

    if (response.error) {
      throw new Error(`Failed to issue credential: ${response.error.value}`);
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
export const credentialsClient = (url: string = 'http://localhost:3001', bran?: string): CredentialsClient => {
  return new CredentialsClient(url, bran);
};