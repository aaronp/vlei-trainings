import { Elysia, t } from 'elysia';
import type { CreateAIDRequest, RotateAIDRequest, OOBIResolveRequest } from './types';
import {
  CreateAIDRequestSchema,
  CreateAIDResponseSchema,
  ListAIDsResponseSchema,
  GetAIDResponseSchema,
  RotateAIDRequestSchema,
  RotateAIDResponseSchema,
  OOBIResolveRequestSchema,
  OOBIResolveResponseSchema
} from './types';
import { aidContext } from './context';

export const aidsRoutes = new Elysia({ prefix: '/aids' })
  .use(aidContext)
  // Create transferable AID
  .post('/', async ({ body, aidRegistry }) => {
    const request = body as CreateAIDRequest;
    const aid = aidRegistry.create(request);
    return { aid };
  }, {
    body: CreateAIDRequestSchema,
    response: {
      201: CreateAIDResponseSchema
    }
  })
  
  // List AIDs
  .get('/', ({ aidRegistry }) => {
    return { aids: aidRegistry.list() };
  }, {
    response: {
      200: ListAIDsResponseSchema
    }
  })
  
  // Get specific AID
  .get('/:aid', ({ params, aidRegistry }) => {
    const aid = aidRegistry.getByPrefix(params.aid);
    if (!aid) {
      throw new Error('AID not found');
    }
    return { aid };
  }, {
    params: t.Object({
      aid: t.String()
    }),
    response: {
      200: GetAIDResponseSchema
    }
  })
  
  // Rotate AID
  .post('/:aid/rotate', ({ params, body, aidRegistry }) => {
    const request = body as RotateAIDRequest;
    const aid = aidRegistry.rotate(params.aid, request);
    return { message: 'AID rotated successfully', aid };
  }, {
    params: t.Object({
      aid: t.String()
    }),
    body: RotateAIDRequestSchema,
    response: {
      200: RotateAIDResponseSchema
    }
  });

// OOBI routes
export const oobiRoutes = new Elysia({ prefix: '/oobis' })
  .use(aidContext)
  .post('/resolve', async ({ body, aidRegistry }) => {
    const request = body as OOBIResolveRequest;
    return aidRegistry.resolveOOBI(request);
  }, {
    body: OOBIResolveRequestSchema,
    response: {
      200: OOBIResolveResponseSchema
    }
  });