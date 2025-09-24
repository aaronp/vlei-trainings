import { Elysia } from 'elysia';
import type { AID, CreateAIDRequest, SignRequest, SignResponse, VerifyRequest, VerifyResponse, RotateRequest, RotateResponse, EventsRequest, EventsResponse } from './types';
import { createAidWithClient } from './impl/createAid';
import { signMessageWithClient, verifyMessageWithClient } from './impl/signOperations';
import { rotateKeysWithClient } from './impl/rotateOperations';
import { listAIDEventsWithClient } from './impl/eventOperations';

interface AIDRegistryStore {
  create(request: CreateAIDRequest, timeoutMs?: number, bran?: string): Promise<AID>;
  sign(request: SignRequest, timeoutMs?: number, bran?: string): Promise<SignResponse>;
  verify(request: VerifyRequest, timeoutMs?: number, bran?: string): Promise<VerifyResponse>;
  rotate(request: RotateRequest, timeoutMs?: number, bran?: string): Promise<RotateResponse>;
  events(request: EventsRequest, timeoutMs?: number, bran?: string): Promise<EventsResponse>;
}

function makeAIDRegistryStore(): AIDRegistryStore {

  return {
    async create(request: CreateAIDRequest, timeoutMs: number = 2000, bran?: string): Promise<AID> {
      return await createAidWithClient(request, timeoutMs, bran);
    },

    async sign(request: SignRequest, timeoutMs: number = 2000, bran?: string): Promise<SignResponse> {
      return await signMessageWithClient(request, timeoutMs, bran);
    },

    async verify(request: VerifyRequest, timeoutMs: number = 2000, bran?: string): Promise<VerifyResponse> {
      return await verifyMessageWithClient(request, timeoutMs, bran);
    },

    async rotate(request: RotateRequest, timeoutMs: number = 2000, bran?: string): Promise<RotateResponse> {
      return await rotateKeysWithClient(request, timeoutMs, bran);
    },

    async events(request: EventsRequest, timeoutMs: number = 2000, bran?: string): Promise<EventsResponse> {
      return await listAIDEventsWithClient(request, timeoutMs, bran);
    },

  };
}

export const aidContext = new Elysia({ name: 'aidRegistry' })
  .state('aidRegistry', makeAIDRegistryStore())
  .derive(({ store }) => ({
    aidRegistry: store.aidRegistry
  }))
  .decorate('aidRegistry', makeAIDRegistryStore());