import { Elysia } from 'elysia';
import type { AID, CreateAIDRequest, RotateAIDRequest, OOBIResolveRequest } from './types';

interface AIDRegistryStore {
  create(request: CreateAIDRequest): AID;
  list(): AID[];
  getByPrefix(prefix: string): AID | undefined;
  rotate(prefix: string, request: RotateAIDRequest): AID;
  resolveOOBI(request: OOBIResolveRequest): { message: string; oobi: string };
}

function makeAIDRegistryStore(): AIDRegistryStore {
  const aids: Map<string, AID> = new Map();

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
      
      aids.set(aid.prefix, aid);
      return aid;
    },

    list(): AID[] {
      return Array.from(aids.values());
    },

    getByPrefix(prefix: string): AID | undefined {
      return aids.get(prefix);
    },

    rotate(prefix: string, request: RotateAIDRequest): AID {
      const aid = aids.get(prefix);
      if (!aid) {
        throw new Error('AID not found');
      }

      // Mock rotation logic
      if (request.wits) {
        aid.state.wits = request.wits;
      }

      return aid;
    },

    resolveOOBI(request: OOBIResolveRequest): { message: string; oobi: string } {
      // Mock OOBI resolution
      return {
        message: 'OOBI resolved successfully',
        oobi: request.oobi
      };
    }
  };
}

export const aidContext = new Elysia({ name: 'aid-context' })
  .state('aidRegistry', makeAIDRegistryStore())
  .derive(({ store }) => ({
    aidRegistry: store.aidRegistry
  }));