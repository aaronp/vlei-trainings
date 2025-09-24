import { SignifyClient, Tier, ready } from 'signify-ts';

export class KeriaClient {
  private static readonly KERIA_URL = process.env.KERIA_URL || 'http://localhost:3901';
  private static readonly KERIA_BOOT_URL = process.env.KERIA_BOOT_URL || 'http://localhost:3903';
  
  private static generateBran(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 21; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static async withClient<T>(
    operation: (client: SignifyClient) => Promise<T>,
    timeoutMs: number = 2000,
    bran?: string
  ): Promise<T> {
    const startTime = Date.now();
    console.log(`🔌 [KERIA] Initializing SignifyClient connection to ${this.KERIA_URL}`);
    
    await ready();
    
    // Use provided bran or generate a new one
    const clientBran = bran || this.generateBran();
    const branSource = bran ? 'provided' : 'generated';
    console.log(`🔑 [KERIA] Using ${branSource} bran: ${clientBran.substring(0, 8)}...`);
    
    const client = new SignifyClient(
      this.KERIA_URL,
      clientBran,
      Tier.low,
      this.KERIA_BOOT_URL
    );
    
    try {
      console.log(`🚀 [KERIA] Booting SignifyClient...`);
      await client.boot();
      
      console.log(`🔗 [KERIA] Connecting to KERIA agent...`);
      await client.connect();
      
      const connectTime = Date.now() - startTime;
      console.log(`✅ [KERIA] Connected successfully in ${connectTime}ms`);
      
      const result = await operation(client);
      
      const totalTime = Date.now() - startTime;
      console.log(`✅ [KERIA] Operation completed in ${totalTime}ms total`);
      
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ [KERIA] Connection or operation failed after ${duration}ms: ${error.message}`);
      throw error;
    } finally {
      // SignifyClient doesn't have disconnect method, connection cleanup happens automatically
      console.log(`🧹 [KERIA] Cleaning up SignifyClient connection`);
    }
  }
}