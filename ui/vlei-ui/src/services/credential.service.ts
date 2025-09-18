import { Serder } from 'signify-ts';
import { KeriaService } from './keria.service';
import type { Operation, VLEICredential } from '../types/keri';

export interface Registry {
  name: string;
  regk: string;
}

export class CredentialService {
  constructor(private keriaService: KeriaService) {}

  async createRegistry(aidAlias: string, registryName: string): Promise<Registry> {
    const client = this.keriaService.getClient();
    if (!client) throw new Error('KERIA client not initialized');

    const result = await client.registries().create({ name: aidAlias, registryName });
    const operation = await result.op();
    
    const response = await this.keriaService.waitForOperation(operation);
    await this.keriaService.deleteOperation(operation.name);

    const registries = await client.registries().list(aidAlias);
    const registry = registries.find((r: any) => r.name === registryName);
    
    if (!registry) throw new Error('Registry creation failed');
    
    return registry;
  }

  async listRegistries(aidAlias: string): Promise<Registry[]> {
    const client = this.keriaService.getClient();
    if (!client) throw new Error('KERIA client not initialized');

    return await client.registries().list(aidAlias);
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

    const operation = await issueResult.op;
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

  async listCredentials(aidAlias?: string): Promise<any[]> {
    const client = this.keriaService.getClient();
    if (!client) throw new Error('KERIA client not initialized');

    return await client.credentials().list(aidAlias);
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