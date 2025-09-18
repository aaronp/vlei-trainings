import { ready, SignifyClient, Tier } from 'signify-ts';
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

  async getAID(name: string): Promise<AID> {
    if (!this.client) throw new Error('Client not initialized');
    
    return await this.client.identifiers().get(name);
  }

  async addEndRole(name: string, role: string, eid?: string): Promise<Operation> {
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