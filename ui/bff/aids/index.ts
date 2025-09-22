import { Elysia, t } from 'elysia';
import type { CreateAIDRequest } from './types';
import {
  CreateAIDRequestSchema,
  CreateAIDResponseSchema,
} from './types';
import { aidContext } from './context';

export const aidsRoutes = new Elysia({ prefix: '/aids' })
  .use(aidContext)
  // Create transferable AID
  .post('/', async ({ body, aidRegistry }) => {
    const request = body as CreateAIDRequest;
    const aid = await aidRegistry.create(request);
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

