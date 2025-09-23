import { treaty } from '@elysiajs/eden';
import type { credentialsRoutes } from './index';
import type { IssueCredentialRequest, IssueCredentialResponse } from './types';

// Type for the combined routes
type CredentialsApi = typeof credentialsRoutes;

export class CredentialsClient {
  private client: ReturnType<typeof treaty<CredentialsApi>>;

  constructor(url: string) {
    this.client = treaty<CredentialsApi>(url);
  }

  // Issue credential
  async issueCredential(request: IssueCredentialRequest): Promise<IssueCredentialResponse> {
    const response = await this.client.credentials.issue.post(request);

    if (response.error) {
      throw new Error(`Failed to issue credential: ${response.error.value}`);
    }

    return response.data;
  }
}

// Factory function to create client
export const credentialsClient = (url: string = 'http://localhost:3001'): CredentialsClient => {
  return new CredentialsClient(url);
};