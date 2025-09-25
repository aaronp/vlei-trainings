import { Elysia, t } from 'elysia';
import type { CreateAIDRequest, SignRequest, VerifyRequest, RotateRequest, EventsRequest, GenerateOOBIRequest, ListAIDsRequest } from './types';
import {
  CreateAIDRequestSchema,
  CreateAIDResponseSchema,
  SignRequestSchema,
  SignResponseSchema,
  VerifyRequestSchema,
  VerifyResponseSchema,
  RotateRequestSchema,
  RotateResponseSchema,
  EventsRequestSchema,
  EventsResponseSchema,
  GenerateOOBIRequestSchema,
  GenerateOOBIResponseSchema,
  ListAIDsRequestSchema,
  ListAIDsResponseSchema,
} from './types';
import { aidContext } from './context';
import { branContext } from '../middleware/branContext';

export const aidsRoutes = new Elysia({ prefix: '/aids' })
  .use(aidContext)
  .use(branContext)
  // List all AIDs
  .get('/', async ({ query, aidRegistry, headers, bran }) => {
    const request = query as ListAIDsRequest;
    const timeoutMs = headers['x-timeout'] ? parseInt(headers['x-timeout'] as string, 10) : 2000;
    const result = await aidRegistry.listAids(request, timeoutMs, bran);
    return result;
  }, {
    query: ListAIDsRequestSchema,
    response: {
      200: ListAIDsResponseSchema
    },
    detail: {
      tags: ['AID'],
      description: 'List all created Autonomic Identifiers',
    },
  })
  // Create transferable AID
  .post('/', async ({ body, aidRegistry, headers, bran }) => {
    const request = body as CreateAIDRequest;
    const timeoutMs = headers['x-timeout'] ? parseInt(headers['x-timeout'] as string, 10) : 2000;
    const aid = await aidRegistry.create(request, timeoutMs, bran);
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
  // Sign a message
  .post('/sign', async ({ body, aidRegistry, headers, bran }) => {
    const request = body as SignRequest;
    const timeoutMs = headers['x-timeout'] ? parseInt(headers['x-timeout'] as string, 10) : 2000;
    const result = await aidRegistry.sign(request, timeoutMs, bran);
    return result;
  }, {
    body: SignRequestSchema,
    response: {
      200: SignResponseSchema
    },
    detail: {
      tags: ['AID'],
      description: 'Sign a text message using an AID private key',
    },
  })
  // Verify a signature
  .post('/verify', async ({ body, aidRegistry, headers, bran }) => {
    const request = body as VerifyRequest;
    const timeoutMs = headers['x-timeout'] ? parseInt(headers['x-timeout'] as string, 10) : 2000;
    const result = await aidRegistry.verify(request, timeoutMs, bran);
    return result;
  }, {
    body: VerifyRequestSchema,
    response: {
      200: VerifyResponseSchema
    },
    detail: {
      tags: ['AID'],
      description: 'Verify a signature against a text message and AID',
    },
  })
  // Rotate AID keys
  .post('/rotate-key', async ({ body, aidRegistry, headers, bran }) => {
    const request = body as RotateRequest;
    const timeoutMs = headers['x-timeout'] ? parseInt(headers['x-timeout'] as string, 10) : 2000;
    const result = await aidRegistry.rotate(request, timeoutMs, bran);
    return result;
  }, {
    body: RotateRequestSchema,
    response: {
      200: RotateResponseSchema
    },
    detail: {
      tags: ['AID'],
      description: 'Rotate the keys of a transferable AID',
    },
  })
  // List AID events
  .get('/events', async ({ query, aidRegistry, headers, bran }) => {
    const request = query as EventsRequest;
    const timeoutMs = headers['x-timeout'] ? parseInt(headers['x-timeout'] as string, 10) : 2000;
    const result = await aidRegistry.events(request, timeoutMs, bran);
    return result;
  }, {
    query: EventsRequestSchema,
    response: {
      200: EventsResponseSchema
    },
    detail: {
      tags: ['AID'],
      description: 'List events (Key Event Log) for an AID',
    },
  })
  // Generate OOBI for an AID
  .post('/oobi', async ({ body, aidRegistry, headers, bran }) => {
    const request = body as GenerateOOBIRequest;
    const timeoutMs = headers['x-timeout'] ? parseInt(headers['x-timeout'] as string, 10) : 2000;
    const result = await aidRegistry.generateOobi(request, timeoutMs, bran);
    return result;
  }, {
    body: GenerateOOBIRequestSchema,
    response: {
      200: GenerateOOBIResponseSchema
    },
    detail: {
      tags: ['AID'],
      description: 'Generate an Out-of-Band Introduction (OOBI) for an AID',
    },
  })

