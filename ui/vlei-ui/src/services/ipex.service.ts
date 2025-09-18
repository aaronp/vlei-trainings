import { KeriaService } from './keria.service';

export interface IPEXGrant {
  said: string;
  credentialSaid: string;
  recipient: string;
  timestamp: string;
  status: 'sent' | 'pending' | 'admitted' | 'rejected';
}

export interface IPEXMessage {
  said: string;
  type: 'grant' | 'admit' | 'reject';
  sender: string;
  recipient: string;
  credentialSaid: string;
  timestamp: string;
  status: 'unread' | 'read' | 'responded';
  credential?: any;
}

export class IPEXService {
  private keriaService: KeriaService;

  constructor(keriaService: KeriaService) {
    this.keriaService = keriaService;
  }

  getClient() {
    return this.keriaService.getClient();
  }

  /**
   * Issuer: Send grant message to offer credential to holder
   */
  async sendGrant(
    issuerAlias: string,
    credentialSaid: string,
    recipientAid: string
  ): Promise<{ grantSaid: string; operation: any }> {
    const client = this.getClient();
    if (!client) throw new Error('KERIA client not initialized');

    try {
      console.log('Sending IPEX grant:', {
        issuer: issuerAlias,
        credential: credentialSaid,
        recipient: recipientAid
      });

      // Send grant using signify-ts IPEX functionality
      const grantResult = await client.ipex().grant({
        senderName: issuerAlias,
        recipient: recipientAid,
        acdc: credentialSaid, // Can be SAID or full credential object
        datetime: new Date().toISOString()
      });

      // Get the grant SAID for tracking
      const grantSaid = grantResult.d || grantResult.exn?.d;
      
      console.log('Grant sent successfully:', grantSaid);
      
      return {
        grantSaid,
        operation: grantResult
      };
    } catch (error) {
      console.error('Failed to send grant:', error);
      throw new Error(`Failed to send grant: ${(error as Error).message}`);
    }
  }

  /**
   * Holder: Get received IPEX messages (grants)
   */
  async getReceivedMessages(holderAlias: string): Promise<IPEXMessage[]> {
    const client = this.getClient();
    if (!client) throw new Error('KERIA client not initialized');

    try {
      console.log('Fetching received IPEX messages for:', holderAlias);

      // Get notifications/messages for the holder
      const notifications = await client.notifications().list();
      console.log('Raw notifications:', notifications);

      // Filter for IPEX grant messages
      const ipexMessages: IPEXMessage[] = [];
      
      if (notifications.notes && Array.isArray(notifications.notes)) {
        for (const note of notifications.notes) {
          if (note.a?.r === '/ipex/grant') {
            const message: IPEXMessage = {
              said: note.i,
              type: 'grant',
              sender: note.a.d || 'unknown',
              recipient: holderAlias,
              credentialSaid: note.a.credential || 'unknown',
              timestamp: note.dt || new Date().toISOString(),
              status: note.r ? 'read' : 'unread',
              credential: note.a.credential
            };
            ipexMessages.push(message);
          }
        }
      }

      console.log('Parsed IPEX messages:', ipexMessages);
      return ipexMessages;
    } catch (error) {
      console.error('Failed to get received messages:', error);
      return []; // Return empty array rather than throwing
    }
  }

  /**
   * Issuer: Get sent IPEX messages (grants sent)
   */
  async getSentGrants(issuerAlias: string): Promise<IPEXGrant[]> {
    const client = this.getClient();
    if (!client) throw new Error('KERIA client not initialized');

    try {
      console.log('Fetching sent grants for:', issuerAlias);

      // This would ideally use signify-ts to get sent messages
      // For now, we'll simulate or use local storage as a fallback
      const sentGrants = this.getSentGrantsFromStorage(issuerAlias);
      
      return sentGrants;
    } catch (error) {
      console.error('Failed to get sent grants:', error);
      return [];
    }
  }

  /**
   * Holder: Admit (accept) a credential grant
   */
  async admitGrant(
    holderAlias: string,
    grantSaid: string,
    issuerAid: string
  ): Promise<{ admitSaid: string; operation: any }> {
    const client = this.getClient();
    if (!client) throw new Error('KERIA client not initialized');

    try {
      console.log('Admitting grant:', {
        holder: holderAlias,
        grant: grantSaid,
        issuer: issuerAid
      });

      // Send admit message using signify-ts
      const admitResult = await client.ipex().admit({
        senderName: holderAlias,
        recipient: issuerAid,
        grantSaid: grantSaid,
        datetime: new Date().toISOString()
      });

      const admitSaid = admitResult.d || admitResult.exn?.d;
      
      console.log('Grant admitted successfully:', admitSaid);
      
      return {
        admitSaid,
        operation: admitResult
      };
    } catch (error) {
      console.error('Failed to admit grant:', error);
      throw new Error(`Failed to admit grant: ${(error as Error).message}`);
    }
  }

  /**
   * Mark a notification as read
   */
  async markMessageAsRead(messageSaid: string): Promise<void> {
    const client = this.getClient();
    if (!client) throw new Error('KERIA client not initialized');

    try {
      await client.notifications().mark(messageSaid);
      console.log('Message marked as read:', messageSaid);
    } catch (error) {
      console.warn('Failed to mark message as read:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Helper: Store sent grants locally for tracking
   */
  private storeSentGrant(grant: IPEXGrant): void {
    const key = `ipex-sent-grants`;
    const stored = localStorage.getItem(key);
    const grants: IPEXGrant[] = stored ? JSON.parse(stored) : [];
    
    grants.push(grant);
    localStorage.setItem(key, JSON.stringify(grants));
  }

  /**
   * Helper: Get sent grants from storage
   */
  private getSentGrantsFromStorage(issuerAlias: string): IPEXGrant[] {
    const key = `ipex-sent-grants`;
    const stored = localStorage.getItem(key);
    if (!stored) return [];

    const allGrants: IPEXGrant[] = JSON.parse(stored);
    return allGrants; // Could filter by issuer if needed
  }

  /**
   * Helper: Clear IPEX storage (for testing)
   */
  clearIPEXStorage(): void {
    localStorage.removeItem('ipex-sent-grants');
    console.log('IPEX storage cleared');
  }

  /**
   * Get credential details from SAID
   */
  async getCredentialBySaid(credentialSaid: string): Promise<any> {
    const client = this.getClient();
    if (!client) throw new Error('KERIA client not initialized');

    try {
      const credential = await client.credentials().get(credentialSaid);
      return credential;
    } catch (error) {
      console.error('Failed to get credential:', error);
      throw new Error(`Failed to get credential: ${(error as Error).message}`);
    }
  }
}

// Create singleton instance
let ipexServiceInstance: IPEXService | null = null;

export const createIPEXService = (keriaService: KeriaService): IPEXService => {
  if (!ipexServiceInstance) {
    ipexServiceInstance = new IPEXService(keriaService);
  }
  return ipexServiceInstance;
};