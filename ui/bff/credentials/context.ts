import { Elysia } from 'elysia';
import type { IssueCredentialRequest, IssueCredentialResponse } from './types';
import { issueCredentialWithClient } from './impl/credentialOperations';

interface CredentialRegistryStore {
  issueCredential(request: IssueCredentialRequest, timeoutMs?: number, bran?: string): Promise<IssueCredentialResponse>;
}

function makeCredentialRegistryStore(): CredentialRegistryStore {
  return {
    async issueCredential(request: IssueCredentialRequest, timeoutMs: number = 2000, bran?: string): Promise<IssueCredentialResponse> {
      return await issueCredentialWithClient(request, timeoutMs, bran);
    }
  };
}

export const credentialContext = new Elysia({ name: 'credentialRegistry' })
  .state('credentialRegistry', makeCredentialRegistryStore())
  .derive(({ store }) => ({
    credentialRegistry: store.credentialRegistry
  }))
  .decorate('credentialRegistry', makeCredentialRegistryStore());