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
  adminUrl: string | null;
  bootUrl: string | null;
  
  // Actions
  initialize: (adminUrl: string, bootUrl: string, passcode: string) => Promise<void>;
  bootstrap: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshAIDs: () => Promise<void>;
  refreshCredentials: () => Promise<void>;
  createAID: (alias: string) => Promise<void>;
  clearStore: () => void;
  restoreConnection: () => Promise<boolean>;
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
      adminUrl: null,
      bootUrl: null,

      // Initialize services
      initialize: async (adminUrl: string, bootUrl: string, passcode: string) => {
        const keriaService = new KeriaService({ adminUrl, bootUrl }, passcode);
        await keriaService.initialize();
        
        const credentialService = new CredentialService(keriaService);
        
        set({
          keriaService,
          credentialService,
          isInitialized: true,
          passcode,
          adminUrl,
          bootUrl
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
        const { credentialService, aids } = get();
        if (!credentialService) throw new Error('Credential service not initialized');
        
        try {
          // Get credentials for all AIDs
          const allCredentials: any[] = [];
          for (const aid of aids) {
            try {
              const aidCredentials = await credentialService.listCredentials(aid.name);
              allCredentials.push(...aidCredentials);
            } catch (error) {
              console.warn(`Failed to get credentials for AID ${aid.name}:`, error);
            }
          }
          set({ credentials: allCredentials });
        } catch (error) {
          console.error('Failed to refresh credentials:', error);
        }
      },

      // Create new AID
      createAID: async (alias: string) => {
        const { keriaService } = get();
        if (!keriaService) throw new Error('KERIA service not initialized');
        
        const { op } = await keriaService.createAID(alias);
        await keriaService.waitForOperation(op);
        await keriaService.deleteOperation(op.name);
        
        // Add agent end role - using the agent's identifier
        const clientState = get().clientState;
        if (clientState?.agent?.i) {
          try {
            const endRoleOp = await keriaService.addEndRole(alias, 'agent', clientState.agent.i);
            await keriaService.waitForOperation(endRoleOp);
            await keriaService.deleteOperation(endRoleOp.name);
          } catch (error) {
            console.warn('Failed to add end role:', error);
            // Continue even if end role fails - AID was created successfully
          }
        }
        
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
          passcode: null,
          adminUrl: null,
          bootUrl: null
        });
      },

      // Restore connection from persisted data
      restoreConnection: async () => {
        const { passcode, adminUrl, bootUrl, isConnected } = get();
        
        // If already connected, no need to restore
        if (isConnected) {
          return true;
        }
        
        // If no persisted connection data, can't restore
        if (!passcode || !adminUrl || !bootUrl) {
          return false;
        }
        
        try {
          console.log('Restoring KERIA connection...');
          
          // Reinitialize services
          const keriaService = new KeriaService({ adminUrl, bootUrl }, passcode);
          await keriaService.initialize();
          
          const credentialService = new CredentialService(keriaService);
          
          // Try to connect to existing agent
          await keriaService.connect();
          
          const clientState = await keriaService.getState();
          const aids = await keriaService.listAIDs();
          
          set({ 
            keriaService,
            credentialService,
            isInitialized: true,
            clientState, 
            isConnected: true,
            aids
          });
          
          console.log('KERIA connection restored successfully');
          return true;
        } catch (error) {
          console.error('Failed to restore KERIA connection:', error);
          // Clear invalid connection data
          set({
            keriaService: null,
            credentialService: null,
            isInitialized: false,
            isConnected: false,
            clientState: null,
            aids: []
          });
          return false;
        }
      }
    }),
    {
      name: 'keri-store',
      partialize: (state) => ({ 
        passcode: state.passcode,
        adminUrl: state.adminUrl,
        bootUrl: state.bootUrl,
        // Don't persist services or volatile connection state
      })
    }
  )
);