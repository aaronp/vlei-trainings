import { Elysia } from 'elysia';
import type { AID, CreateAIDRequest } from './types';

interface AIDRegistryStore {
  create(request: CreateAIDRequest): AID;
}

function makeAIDRegistryStore(): AIDRegistryStore {

  return {
    create(request: CreateAIDRequest): AID {
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

      return aid;
    },

  };
}

export const aidContext = new Elysia({ name: 'aidRegistry' })
  .state('aidRegistry', makeAIDRegistryStore())
  .derive(({ store }) => ({
    aidRegistry: store.aidRegistry
  }))
  .decorate('aidRegistry', makeAIDRegistryStore());