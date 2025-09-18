import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ClientState, AID } from '../types/keri';
import { KeriaService } from '../services/keria.service';
import { CredentialService } from '../services/credential.service';

interface KeriStore {
  // State
  keriaService: KeriaService | null;
  credentialService: CredentialService | null;
  isInitialized: boolean;
  isConnected: boolean;
  clientState: ClientState | null;
  aids: AID[];
  credentials: any[];
  passcode: string | null;
  
  // Actions
  initialize: (adminUrl: string, bootUrl: string, passcode: string) => Promise<void>;
  bootstrap: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshAIDs: () => Promise<void>;
  refreshCredentials: () => Promise<void>;
  createAID: (alias: string) => Promise<void>;
  clearStore: () => void;
}

export const useKeriStore = create<KeriStore>()(
  persist(
    (set, get) => ({
      // Initial state
      keriaService: null,
      credentialService: null,
      isInitialized: false,
      isConnected: false,
      clientState: null,
      aids: [],
      credentials: [],
      passcode: null,

      // Initialize services
      initialize: async (adminUrl: string, bootUrl: string, passcode: string) => {
        const keriaService = new KeriaService({ adminUrl, bootUrl }, passcode);
        await keriaService.initialize();
        
        const credentialService = new CredentialService(keriaService);
        
        set({
          keriaService,
          credentialService,
          isInitialized: true,
          passcode
        });
      },

      // Bootstrap new agent
      bootstrap: async () => {
        const { keriaService } = get();
        if (!keriaService) throw new Error('KERIA service not initialized');
        
        await keriaService.boot();
        await keriaService.connect();
        
        const clientState = await keriaService.getState();
        set({ clientState, isConnected: true });
      },

      // Connect to existing agent
      connect: async () => {
        const { keriaService } = get();
        if (!keriaService) throw new Error('KERIA service not initialized');
        
        await keriaService.connect();
        
        const clientState = await keriaService.getState();
        const aids = await keriaService.listAIDs();
        
        set({ 
          clientState, 
          isConnected: true,
          aids
        });
        
        // Refresh credentials
        get().refreshCredentials();
      },

      // Disconnect
      disconnect: () => {
        set({
          isConnected: false,
          clientState: null,
          aids: [],
          credentials: []
        });
      },

      // Refresh AIDs
      refreshAIDs: async () => {
        const { keriaService } = get();
        if (!keriaService) throw new Error('KERIA service not initialized');
        
        try {
          const aids = await keriaService.listAIDs();
          set({ aids: aids || [] });
        } catch (error) {
          console.error('Failed to refresh AIDs:', error);
          set({ aids: [] });
        }
      },

      // Refresh credentials
      refreshCredentials: async () => {
        const { credentialService } = get();
        if (!credentialService) throw new Error('Credential service not initialized');
        
        try {
          const credentials = await credentialService.listCredentials();
          set({ credentials });
        } catch (error) {
          console.error('Failed to refresh credentials:', error);
        }
      },

      // Create new AID
      createAID: async (alias: string) => {
        const { keriaService } = get();
        if (!keriaService) throw new Error('KERIA service not initialized');
        
        const { aid, op } = await keriaService.createAID(alias);
        await keriaService.waitForOperation(op);
        await keriaService.deleteOperation(op.name);
        
        // Add agent end role
        const endRoleOp = await keriaService.addEndRole(alias, 'agent');
        await keriaService.waitForOperation(endRoleOp);
        await keriaService.deleteOperation(endRoleOp.name);
        
        // Refresh AIDs
        await get().refreshAIDs();
      },

      // Clear store
      clearStore: () => {
        set({
          keriaService: null,
          credentialService: null,
          isInitialized: false,
          isConnected: false,
          clientState: null,
          aids: [],
          credentials: [],
          passcode: null
        });
      }
    }),
    {
      name: 'keri-store',
      partialize: (state) => ({ 
        passcode: state.passcode,
        // Don't persist services or connection state
      })
    }
  )
);