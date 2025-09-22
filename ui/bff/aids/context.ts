import { Elysia } from 'elysia';
import type { AID, CreateAIDRequest } from './types';
import { createAidWithClient } from './impl/createAid';

interface AIDRegistryStore {
  create(request: CreateAIDRequest): Promise<AID>;
}

function makeAIDRegistryStore(): AIDRegistryStore {

  return {
    async create(request: CreateAIDRequest): Promise<AID> {
      return await createAidWithClient(request);
    },

  };
}

export const aidContext = new Elysia({ name: 'aidRegistry' })
  .state('aidRegistry', makeAIDRegistryStore())
  .derive(({ store }) => ({
    aidRegistry: store.aidRegistry
  }))
  .decorate('aidRegistry', makeAIDRegistryStore());