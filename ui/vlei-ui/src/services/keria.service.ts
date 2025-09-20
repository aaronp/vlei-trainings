import { ready, SignifyClient, Tier, type HabState } from 'signify-ts';
import type { KeriConfig, ClientState, AID, Operation } from '../types/keri';

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
    // Create new AID
    const result = await this._createAIDFireAndForget(alias, config);
    const { op } = result

    // Wait for operation to complete
    const completedOp = await this.waitForOperation(op);
    if (!completedOp.done) {
      throw new Error("creating AID is not done")
    }

    // Clean up operation
    await this.deleteOperation(op.name);

    return result;
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

  async waitForOperation(operation: Operation, timeoutMs = 30000): Promise<Operation> {
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

    const result = await this.client.identifiers().list();
    console.log('listAIDs result:', result);

    // Handle paginated response format
    if (result && typeof result === 'object' && 'aids' in result) {
      // Map the API response to our AID interface
      return result.aids.map((aid: any) => ({
        i: aid.prefix,
        name: aid.name
      }));
    }

    // Handle direct array response
    if (Array.isArray(result)) {
      return result.map((aid: any) => ({
        i: aid.prefix || aid.i,
        name: aid.name
      }));
    }

    return [];
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

  return keriaService;
}
