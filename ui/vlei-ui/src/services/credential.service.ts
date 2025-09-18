import { Serder } from 'signify-ts';
import { KeriaService } from './keria.service';
import type { Operation } from '../types/keri';

export interface Registry {
  name: string;
  regk: string;
}

export class CredentialService {
  private keriaService: KeriaService;

  constructor(keriaService: KeriaService) {
    this.keriaService = keriaService;
  }

  getClient() {
    return this.keriaService.getClient();
  }

  async createRegistry(aidAlias: string, registryName: string): Promise<Registry> {
    const client = this.keriaService.getClient();
    if (!client) throw new Error('KERIA client not initialized');

    try {
      const result = await client.registries().create({ name: aidAlias, registryName });
      const operation = typeof result.op === 'function' ? await result.op() : result;

      await this.keriaService.waitForOperation(operation);
      await this.keriaService.deleteOperation(operation.name);
    } catch (error: any) {
      // If registry already exists, that's ok - we'll just fetch it
      if (!error.message?.includes('already in use')) {
        throw error;
      }
      console.log('Registry already exists, fetching it...');
    }

    // Fetch the registry (whether we just created it or it already existed)
    const registries = await this.listRegistries(aidAlias);
    console.log('All registries after create attempt:', registries);

    // Different KERIA versions might use different property names
    const registry = registries.find((r: any) =>
      r.name === registryName ||
      r.registryName === registryName
    );

    if (!registry) {
      console.error('Available registries:', registries);
      throw new Error(`Registry "${registryName}" not found after creation attempt`);
    }

    return registry;
  }

  async listRegistries(aidAlias: string): Promise<Registry[]> {
    const client = this.keriaService.getClient();
    if (!client) throw new Error('KERIA client not initialized');

    try {
      const result = await client.registries().list(aidAlias);
      // Handle different response formats
      if (Array.isArray(result)) {
        return result;
      } else if (result && typeof result === 'object' && 'registries' in result) {
        return result.registries || [];
      }
      return [];
    } catch (error) {
      console.error('Error listing registries:', error);
      // Return empty array if listing fails (AID might not have any registries yet)
      return [];
    }
  }

  async issueVLEI(
    issuerAlias: string,
    registryId: string,
    schemaSaid: string,
    recipientAid: string,
    vleiData: {
      lei: string;
      entityName: string;
      entityType: string;
      [key: string]: any;
    }
  ): Promise<{ credential: any; operation: Operation }> {
    const client = this.keriaService.getClient();
    if (!client) throw new Error('KERIA client not initialized');

    const issueResult = await client.credentials().issue(issuerAlias, {
      ri: registryId,
      s: schemaSaid,
      a: {
        i: recipientAid,
        ...vleiData
      }
    });

    const operation: Operation = typeof (issueResult as any).op === 'function'
      ? await (issueResult as any).op()
      : (issueResult as any);
    const response = await this.keriaService.waitForOperation(operation);

    const credentialSaid = response.response.ced.d;
    const credential = await client.credentials().get(credentialSaid);

    return { credential, operation };
  }

  async grantCredential(
    senderAlias: string,
    credential: any,
    recipientAid: string
  ): Promise<Operation> {
    const client = this.keriaService.getClient();
    if (!client) throw new Error('KERIA client not initialized');

    const datetime = new Date().toISOString();

    const [grant, gsigs, gend] = await client.ipex().grant({
      senderName: senderAlias,
      acdc: new Serder(credential.sad),
      iss: new Serder(credential.iss),
      anc: new Serder(credential.anc),
      ancAttachment: credential.ancatc,
      recipient: recipientAid,
      datetime
    });

    const submitOperation = await client.ipex().submitGrant(
      senderAlias,
      grant,
      gsigs,
      gend,
      [recipientAid]
    );

    return await this.keriaService.waitForOperation(submitOperation);
  }

  async listCredentials(aidAlias: string): Promise<any[]> {
    const client = this.keriaService.getClient();
    if (!client) throw new Error('KERIA client not initialized');

    return await (client.credentials() as any).list(aidAlias);
  }

  async getCredential(said: string): Promise<any> {
    const client = this.keriaService.getClient();
    if (!client) throw new Error('KERIA client not initialized');

    return await client.credentials().get(said);
  }

  async getNotifications(route?: string): Promise<any[]> {
    const client = this.keriaService.getClient();
    if (!client) throw new Error('KERIA client not initialized');

    const allNotifications = await client.notifications().list();

    if (route) {
      return allNotifications.notes.filter((n: any) => n.a.r === route && !n.r);
    }

    return allNotifications.notes;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const client = this.keriaService.getClient();
    if (!client) throw new Error('KERIA client not initialized');

    await client.notifications().mark(notificationId);
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const client = this.keriaService.getClient();
    if (!client) throw new Error('KERIA client not initialized');

    await client.notifications().delete(notificationId);
  }

  async admitGrant(
    senderAlias: string,
    grantSaid: string,
    recipientAid: string
  ): Promise<Operation> {
    const client = this.keriaService.getClient();
    if (!client) throw new Error('KERIA client not initialized');

    const datetime = new Date().toISOString();

    const [admit, sigs, aend] = await client.ipex().admit({
      senderName: senderAlias,
      message: '',
      grantSaid,
      recipient: recipientAid,
      datetime
    });

    const admitOperation = await client.ipex().submitAdmit(
      senderAlias,
      admit,
      sigs,
      aend,
      [recipientAid]
    );

    return await this.keriaService.waitForOperation(admitOperation);
  }
}