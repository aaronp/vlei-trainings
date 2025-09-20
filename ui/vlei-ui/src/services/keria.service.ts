import { ready, SignifyClient, Tier, type HabState } from 'signify-ts';
import type { KeriConfig, ClientState, AID, Operation } from '../types/keri';
import { eventually } from '../utils/retry.js';

export class KeriaService {
  private client: SignifyClient | null = null;
  private config: KeriConfig;
  private bran: string;
  private isInitialized = false;

  constructor(config: KeriConfig, bran?: string) {
    this.config = config;
    // Ensure bran is exactly 21 characters
    this.bran = bran ? this.ensureBranLength(bran) : this.generateBran();
  }

  private ensureBranLength(bran: string): string {
    if (bran.length === 21) return bran;
    if (bran.length > 21) return bran.substring(0, 21);
    return bran.padEnd(21, '0');
  }

  private generateBran(): string {
    // Generate a random 21-character string
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 21; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await ready();
    this.client = new SignifyClient(
      this.config.adminUrl,
      this.bran,
      Tier.low, // Using low tier for development
      this.config.bootUrl
    );
    this.isInitialized = true;
  }

  async boot(): Promise<void> {
    if (!this.client) throw new Error('Client not initialized');

    await this.client.boot();
  }

  async connect(): Promise<void> {
    if (!this.client) throw new Error('Client not initialized');

    await this.client.connect();
  }

  async getState(): Promise<ClientState> {
    if (!this.client) throw new Error('Client not initialized');

    return await this.client.state();
  }

  async createAID(alias: string, config?: any): Promise<{ aid: AID; op: Operation }> {
    try {
      // Try to create new AID
      const result = await this._createAIDFireAndForget(alias, config);
      const { op } = result

      // Wait for operation to complete
      const completedOp = await this.waitForOperation(op);
      if (!completedOp.done) {
        throw new Error("creating AID is not done")
      }

      // Clean up operation
      await this.deleteOperation(op.name);

      // Construct the AID object with the correct structure
      // After the operation completes, we need to get the AID identifier from the operation response
      const aidIdentifier = completedOp.response?.anchor?.i || 
                            completedOp.response?.i || 
                            (result.aid as any).i || 
                            (result.aid as any).prefix || 
                            (result.aid as any).pre;
                            
      if (!aidIdentifier) {
        throw new Error(`Could not determine AID identifier for ${alias}. Operation response: ${JSON.stringify(completedOp.response)}`);
      }

      const aid: AID = {
        i: aidIdentifier,
        name: alias
      };

      return { aid, op };
    } catch (error: any) {
      // If AID already exists, retrieve it instead
      if (error.message?.includes('already incepted')) {
        console.log(`AID ${alias} already exists, retrieving existing AID...`);
        const aids = await this.listAIDs();
        const existingAid = aids.find(aid => aid.name === alias);
        if (existingAid) {
          // Return the existing AID with a dummy operation
          return { 
            aid: existingAid, 
            op: { name: 'existing-aid', done: true } as Operation 
          };
        } else {
          throw new Error(`AID ${alias} reported as existing but not found in list`);
        }
      }
      throw error;
    }
  }

  async _createAIDFireAndForget(alias: string, config?: any): Promise<{ aid: AID; op: Operation }> {
    if (!this.client) throw new Error('Client not initialized');

    const defaultConfig = {
      toad: 2,
      wits: [
        'BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha',
        'BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM',
        'BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX'
      ]
    };

    const result = await this.client.identifiers().create(alias, config || defaultConfig);
    const operation = await result.op();

    return {
      aid: result,
      op: operation
    };
  }

  async waitForOperation(operation: Operation, timeoutMs: number = 3000): Promise<Operation> {
    if (!this.client) throw new Error('Client not initialized');

    try {
      return await this.client.operations().wait(operation, AbortSignal.timeout(timeoutMs));
    } catch (error: any) {
      // If operation not found (404), consider it completed
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        console.log('Operation not found (likely completed):', operation.name);
        return { ...operation, done: true };
      }
      throw error;
    }
  }

  async listOperations(): Promise<Operation[]> {
    if (!this.client) throw new Error('Client not initialized');

    return await this.client.operations().list();
  }

  async deleteOperation(name: string): Promise<void> {
    if (!this.client) throw new Error('Client not initialized');

    await this.client.operations().delete(name);
  }


  async listAIDs(): Promise<AID[]> {
    if (!this.client) throw new Error('Client not initialized');

    let allAids: any[] = [];
    let start = 0;
    const limit = 25; // Default page size
    
    while (true) {
      const result = await this.client.identifiers().list(start, limit);
      console.log(`listAIDs result (start=${start}, limit=${limit}):`, result);

      // Handle paginated response format
      if (result && typeof result === 'object' && 'aids' in result) {
        allAids.push(...result.aids);
        
        // Check if we've got all AIDs
        if (result.aids.length < limit || allAids.length >= result.total) {
          break;
        }
        start += limit;
      } else if (Array.isArray(result)) {
        // Handle direct array response (non-paginated)
        allAids = result;
        break;
      } else {
        break;
      }
    }

    // Map the API response to our AID interface
    return allAids.map((aid: any) => ({
      i: aid.prefix || aid.i,
      name: aid.name
    }));
  }

  async getAID(name: string): Promise<HabState> {
    if (!this.client) throw new Error('Client not initialized');

    return await this.client.identifiers().get(name);
  }

  async addEndRole(name: string, role: string, eid?: string): Promise<string> {
    const endRoleOp = await this._addEndRole(name, role, eid);
    await this.waitForOperation(endRoleOp);
    await this.deleteOperation(endRoleOp.name);

    return endRoleOp.name
  }
  async _addEndRole(name: string, role: string, eid?: string): Promise<Operation> {
    if (!this.client) throw new Error('Client not initialized');

    const result = await this.client.identifiers().addEndRole(name, role, eid);
    return await result.op();
  }

  async generateOOBI(name: string, role: string): Promise<string> {
    if (!this.client) throw new Error('Client not initialized');

    const result = await this.client.oobis().get(name, role);
    return result.oobis[0];
  }

  async resolveOOBI(oobi: string, alias: string): Promise<Operation> {
    if (!this.client) throw new Error('Client not initialized');

    // Generate a unique alias to avoid conflicts
    const uniqueAlias = `${alias}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const result = await this.client.oobis().resolve(oobi, uniqueAlias);
    // Check if result has an op method, otherwise return result directly
    if (typeof result.op === 'function') {
      return await result.op();
    }
    return result;
  }

  getClient(): SignifyClient | null {
    return this.client;
  }

  /**
   * Ensures the client is initialized and connected, throws error if not
   */
  getClientOrThrow(): SignifyClient {
    if (!this.client) {
      throw new Error('KERIA client not initialized. Call initialize() and connect() first.');
    }
    if (!this.isInitialized) {
      throw new Error('KERIA service not properly initialized. Call initialize() first.');
    }
    return this.client;
  }

  /**
   * Checks if the client is ready for operations
   */
  isClientReady(): boolean {
    return this.client !== null && this.isInitialized;
  }

  // High-level helper methods for complete workflows

  /**
   * Creates a complete QVI (issuer) setup: AID + end role
   */
  async createQVI(alias: string): Promise<{ aid: AID; agentEndRole: string }> {
    // Create the AID
    const aidResult = await this.createAID(alias);
    
    // Get agent identifier for end role
    const clientState = await this.getState();
    if (!clientState.agent?.i) {
      throw new Error('Agent identifier not found in client state');
    }
    
    // Add agent end role
    const endRoleName = await this.addEndRole(alias, 'agent', clientState.agent.i);
    
    return {
      aid: aidResult.aid,
      agentEndRole: endRoleName
    };
  }

  /**
   * Creates a complete holder setup: AID + end role
   */
  async createHolder(alias: string): Promise<{ aid: AID; agentEndRole: string }> {
    // Reuse QVI creation logic since both need AID + end role
    return this.createQVI(alias);
  }

  /**
   * Creates a complete issuer workflow: QVI + registry
   */
  async createIssuerWorkflow(qviAlias: string, registryName: string): Promise<{
    qvi: { aid: AID; agentEndRole: string };
    registry: { name: string; regk: string };
  }> {
    const qvi = await this.createQVI(qviAlias);
    
    // Create registry - we'll need to import CredentialService for this
    // For now, return the QVI and let the caller create the registry
    return {
      qvi,
      registry: { name: registryName, regk: '' } // Placeholder
    };
  }

  /**
   * Waits for multiple operations to complete
   */
  async waitForOperations(operations: Operation[], timeoutMs: number = 3000): Promise<Operation[]> {
    const results = await Promise.all(
      operations.map(op => this.waitForOperation(op, timeoutMs))
    );
    
    // Clean up completed operations
    await Promise.all(
      operations.map(op => this.deleteOperation(op.name).catch(err => 
        console.warn(`Failed to delete operation ${op.name}:`, err)
      ))
    );
    
    return results;
  }

  /**
   * Checks if a schema is loaded in KERIA by attempting to retrieve it
   */
  async isSchemaLoaded(schemaSaid: string): Promise<boolean> {
    if (!this.client) throw new Error('Client not initialized');
    
    try {
      // Try to get the schema from KERIA's schema registry
      const result = await this.client.schemas().get(schemaSaid);
      return result !== null && result !== undefined;
    } catch (error) {
      // Schema not found in KERIA
      console.log(`Schema ${schemaSaid} not found in KERIA:`, error.message);
      return false;
    }
  }

  /**
   * List all schemas currently loaded in KERIA
   */
  async listLoadedSchemas(): Promise<any[]> {
    if (!this.client) throw new Error('Client not initialized');
    
    try {
      const result = await this.client.schemas().list();
      console.log(`Found ${Array.isArray(result) ? result.length : 'unknown'} schemas in KERIA`);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.log(`Failed to list schemas in KERIA:`, error.message);
      return [];
    }
  }


  /**
   * Enhanced OOBI resolution with proper schema loading
   */
  async resolveSchemaOOBI(
    oobi: string, 
    schemaSaid: string, 
    timeout: number = 3000
  ): Promise<{
    success: boolean;
    operation?: Operation;
    error?: string;
  }> {
    if (!this.client) throw new Error('Client not initialized');

    // First check if schema is already loaded
    const isLoaded = await this.isSchemaLoaded(schemaSaid);
    if (isLoaded) {
      console.log(`Schema ${schemaSaid} already loaded in KERIA`);
      return { success: true };
    }

    try {
      console.log(`Resolving schema OOBI in KERIA: ${oobi}`);
      
      // Generate a unique alias to avoid conflicts
      const uniqueAlias = `schema-${schemaSaid.slice(-8)}-${Date.now()}`;
      console.log(`Using OOBI alias: ${uniqueAlias}`);
      
      const result = await this.client.oobis().resolve(oobi, uniqueAlias);
      
      let operation: Operation;
      if (typeof result.op === 'function') {
        operation = await result.op();
      } else {
        operation = result as Operation;
      }

      console.log(`OOBI resolution operation: ${operation.name} (done: ${operation.done})`);

      // Wait for operation to complete if not already done
      if (!operation.done) {
        console.log(`Waiting for OOBI resolution operation to complete (${timeout}ms)...`);
        try {
          const completedOperation = await this.waitForOperation(operation, timeout);
          console.log(`OOBI resolution completed: ${completedOperation.done}`);
          
          // Clean up the operation
          await this.deleteOperation(operation.name).catch(err => 
            console.warn(`Failed to cleanup OOBI operation:`, err)
          );
        } catch (waitError) {
          console.warn(`OOBI operation wait timed out after ${timeout}ms: ${waitError.message}`);
          console.log(`Attempting to clean up hanging operation: ${operation.name}`);
          
          // Try to clean up the hanging operation
          await this.deleteOperation(operation.name).catch(err => 
            console.warn(`Failed to cleanup hanging OOBI operation:`, err)
          );
          
          // Don't throw immediately - maybe the schema is actually loaded despite the timeout
          console.log(`Continuing with schema verification despite operation timeout...`);
        }
      }

      // Use eventually to wait for the schema to be loaded
      console.log(`Verifying schema is loaded in KERIA...`);
      await eventually(
        async () => {
          const loaded = await this.isSchemaLoaded(schemaSaid);
          if (!loaded) {
            throw new Error(`Schema ${schemaSaid} not yet available in KERIA`);
          }
          return true;
        },
        {
          timeout: Math.min(timeout, 3000), // Never exceed 3 seconds for verification
          interval: 100,
          description: 'Schema availability check'
        }
      );

      console.log(`✅ Schema ${schemaSaid} successfully loaded in KERIA via OOBI`);
      return { success: true, operation };

    } catch (error) {
      console.error(`❌ Failed to resolve schema OOBI in KERIA:`, error.message);
      return { success: false, error: error.message };
    }
  }
}

// Factory method options
export interface ConnectOptions {
  autoBootstrap?: boolean; // Whether to automatically bootstrap if no agent exists (default: true)
  logger?: (message: string) => void; // Optional logging function
}

/**
 * Factory method to create and connect a KeriaService instance
 * 
 * This method encapsulates the common pattern of:
 * 1. Creating a new KeriaService
 * 2. Initializing the client
 * 3. Attempting to connect to an existing agent
 * 4. Optionally bootstrapping a new agent if none exists
 * 
 * @param config - KERIA configuration (adminUrl and bootUrl)
 * @param bran - Passcode/brand for the agent (optional)
 * @param options - Connection options
 * @returns Promise<KeriaService> - A connected KeriaService instance
 * 
 * @example
 * const keriaService = await createConnectedKeriaService(
 *   { adminUrl: 'http://localhost:3901', bootUrl: 'http://localhost:3903' },
 *   'my-passcode',
 *   { autoBootstrap: true }
 * );
 */
export async function createConnectedKeriaService(
  config: KeriConfig,
  bran?: string,
  options: ConnectOptions = {}
): Promise<KeriaService> {
  const { autoBootstrap = true, logger = console.log } = options;

  // Create the service instance
  const keriaService = new KeriaService(config, bran);

  // Initialize the client
  logger('Initializing KERIA connection...');
  await keriaService.initialize();

  try {
    // Try to connect to existing agent first
    await keriaService.connect();
    logger('Connected to existing KERIA agent');
  } catch (error) {
    if (!autoBootstrap) {
      throw new Error('No existing agent found and autoBootstrap is disabled');
    }

    // If no agent exists, bootstrap a new one
    logger('No existing agent found, bootstrapping new agent...');
    await keriaService.boot();
    await keriaService.connect();
    logger('Bootstrapped and connected to new KERIA agent');
  }

  // Validate the connection is working
  if (!keriaService.isClientReady()) {
    throw new Error('KERIA service initialization failed: client not ready after connection');
  }

  // Test basic operations to ensure client is functional
  try {
    const state = await keriaService.getState();
    logger(`KERIA connection validated. Agent: ${state.agent?.i || 'Not available'}`);
  } catch (error) {
    throw new Error(`KERIA connection validation failed: ${error.message}`);
  }

  return keriaService;
}
