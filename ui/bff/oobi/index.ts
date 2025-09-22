import { Elysia, t } from 'elysia';
import type { ResolveOOBIRequest } from './types';
import {
  ResolveOOBIRequestSchema,
  ResolveOOBIResponseSchema,
} from './types';
import { oobiContext } from './context';

export const oobiRoutes = new Elysia({ prefix: '/oobi' })
  .use(oobiContext)
  // Resolve OOBI
  .post('/resolve', async ({ body, oobiRegistry, headers }) => {
    const request = body as ResolveOOBIRequest;
    const timeoutMs = headers['x-timeout'] ? parseInt(headers['x-timeout'] as string, 10) : 2000;
    const response = await oobiRegistry.resolve(request, timeoutMs);
    return { response };
  }, {
    body: ResolveOOBIRequestSchema,
    response: {
      201: t.Object({
        response: ResolveOOBIResponseSchema
      })
    },
    detail: {
      tags: ['OOBI'],
      description: 'Resolve an Out-of-Band Introduction (OOBI)',
    },
  })