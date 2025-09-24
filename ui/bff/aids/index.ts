import { Elysia, t } from 'elysia';
import type { CreateAIDRequest } from './types';
import {
  CreateAIDRequestSchema,
  CreateAIDResponseSchema,
} from './types';
import { aidContext } from './context';
import { branContext } from '../middleware/branContext';

export const aidsRoutes = new Elysia({ prefix: '/aids' })
  .use(branContext)
  .use(aidContext)
  // Create transferable AID
  .post('/', async ({ body, aidRegistry, headers, branContext }) => {
    const request = body as CreateAIDRequest;
    const timeoutMs = headers['x-timeout'] ? parseInt(headers['x-timeout'] as string, 10) : 2000;
    const aid = await aidRegistry.create(request, timeoutMs, branContext.bran);
    return { aid };
  }, {
    body: CreateAIDRequestSchema,
    response: {
      201: CreateAIDResponseSchema
    },
    detail: {
      tags: ['AID'],
      description: 'Create a new Autonomic Identifier',
    },
  })

