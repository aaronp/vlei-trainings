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
    operation: (client: SignifyClient) => Promise<T>
  ): Promise<T> {
    await ready();
    
    const bran = this.generateBran();
    const client = new SignifyClient(
      this.KERIA_URL,
      bran,
      Tier.low,
      this.KERIA_BOOT_URL
    );
    
    try {
      await client.boot();
      await client.connect();
      
      return await operation(client);
    } finally {
      // SignifyClient doesn't have disconnect method, connection cleanup happens automatically
    }
  }
}