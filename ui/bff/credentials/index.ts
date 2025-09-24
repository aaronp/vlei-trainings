import { Elysia, t } from 'elysia';
import type { IssueCredentialRequest } from './types';
import {
  IssueCredentialRequestSchema,
  IssueCredentialResponseSchema
} from './types';
import { credentialContext } from './context';
import { branContext } from '../middleware/branContext';

export const credentialsRoutes = new Elysia({ prefix: '/credentials' })
  .use(branContext)
  .use(credentialContext)
  
  // Issue a credential (ACDC)
  .post('/issue', async ({ body, credentialRegistry, headers, branContext }) => {
    const request = body as IssueCredentialRequest;
    const timeoutMs = headers['x-timeout'] ? parseInt(headers['x-timeout'] as string, 10) : 2000;
    const result = await credentialRegistry.issueCredential(request, timeoutMs, branContext.bran);
    return result;
  }, {
    body: IssueCredentialRequestSchema,
    response: {
      201: IssueCredentialResponseSchema
    },
    detail: {
      tags: ['Credentials'],
      description: 'Issues a vLEI (an ACDC) from issuer AID to subject AID with a schema',
    },
  });