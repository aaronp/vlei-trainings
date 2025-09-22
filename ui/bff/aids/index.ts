import { Elysia, t } from 'elysia';
import type { CreateAIDRequest, AID, RotateAIDRequest, OOBIResolveRequest } from './types';
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

// Mock data store
const aids: Map<string, AID> = new Map();

export const aidsRoutes = new Elysia({ prefix: '/aids' })
  // Create transferable AID
  .post('/', async ({ body }) => {
    const request = body as CreateAIDRequest;
    
    // Mock implementation
    const aid: AID = {
      prefix: `E${Math.random().toString(36).substring(2, 15)}`,
      alias: request.alias,
      transferable: request.transferable ?? true,
      state: {
        wits: request.wits || [],
        icount: request.icount ?? 1,
        ncount: request.ncount ?? 1
      }
    };
    
    aids.set(aid.prefix, aid);
    
    return { aid };
  }, {
    body: CreateAIDRequestSchema,
    response: {
      201: CreateAIDResponseSchema
    }
  })
  
  // List AIDs
  .get('/', () => {
    return { aids: Array.from(aids.values()) };
  }, {
    response: {
      200: ListAIDsResponseSchema
    }
  })
  
  // Get specific AID
  .get('/:aid', ({ params }) => {
    const aid = aids.get(params.aid);
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
  .post('/:aid/rotate', ({ params, body }) => {
    const aid = aids.get(params.aid);
    if (!aid) {
      throw new Error('AID not found');
    }
    
    const request = body as RotateAIDRequest;
    
    // Mock rotation logic
    if (request.wits) {
      aid.state.wits = request.wits;
    }
    
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
  .post('/resolve', async ({ body }) => {
    const request = body as OOBIResolveRequest;
    
    // Mock OOBI resolution
    return { 
      message: 'OOBI resolved successfully',
      oobi: request.oobi
    };
  }, {
    body: OOBIResolveRequestSchema,
    response: {
      200: OOBIResolveResponseSchema
    }
  });