import { Serder } from 'signify-ts';
import { KeriaService } from './keria.service';
import type { Operation } from '../types/keri';

export interface Registry {
  name: string;
  regk: string;
  registryName?: string; // Optional property for compatibility with different KERIA versions
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
    // Ensure KERIA client is ready before proceeding
    if (!this.keriaService.isClientReady()) {
      throw new Error('KERIA service not ready. Please ensure it is properly initialized and connected.');
    }
    const client = this.keriaService.getClientOrThrow();

    console.log('Creating registry with params:', { aidAlias, registryName });

    // First check if the AID exists and is valid
    try {
      const aidState = await this.keriaService.getAID(aidAlias);
      if (!aidState) {
        throw new Error(`aid alias ${aidAlias} not found`);
      }
    } catch (error) {
      throw new Error(`aid alias ${aidAlias} not found`);
    }

    let completedOperation: any = null;

    try {
      const request = { name: aidAlias, registryName }
      console.log(`creating registry ${request}`);
      const result = await client.registries().create(request);
      console.log('Registry create result:', result);
      console.log('Registry create result type:', typeof result);
      console.log('Registry create result keys:', Object.keys(result));

      // Handle different result formats - check if it has an op function 
      let operation;
      console.log('Checking for op method...');
      console.log('typeof result.op:', typeof result.op);
      console.log('Result prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(result)));

      if (typeof result.op === 'function') {
        console.log('Found op method, calling it...');
        operation = await result.op();
      } else {
        // Check if we can find the operation data in the result object itself
        console.log('No op function found, checking result structure...');

        // The result might already contain the operation data
        if ((result as any).name && ((result as any).done !== undefined || (result as any).metadata)) {
          console.log('Result appears to be an operation already');
          operation = result as any;
        } else {
          throw new Error('Cannot find operation in registry creation result. Result structure: ' + JSON.stringify(result, null, 2));
        }
      }
      console.log('Operation details:', operation);

      completedOperation = await this.keriaService.waitForOperation(operation);
      console.log('Completed operation:', completedOperation);
      console.log('Operation response:', completedOperation.response);

      await this.keriaService.deleteOperation(operation.name);
      console.log('Registry creation operation completed successfully');
    } catch (error: any) {
      console.log('creating registry caught: ' + error);

      // If registry already exists, that's ok - we'll just fetch it
      if (!error.message?.includes('already in use')) {
        throw error;
      }
      console.log('Registry already exists, fetching it...');
    }

    // Small delay to allow backend to process the registry creation
    await new Promise(resolve => setTimeout(resolve, 100));

    // Fetch the registry (whether we just created it or it already existed)
    const registries = await this.listRegistries(aidAlias);

    // Try to get registry info from the completed operation response if list is empty
    if (registries.length === 0 && completedOperation?.response) {
      console.log('No registries found in list, checking operation response for registry info');
      const opResponse = completedOperation.response;

      // Check if the operation response contains registry information
      if (opResponse.regk || opResponse.registry || opResponse.anchor) {
        console.log('Found registry info in operation response:', opResponse);
        const registryFromOp = {
          name: registryName,
          registryName: registryName,
          regk: opResponse.regk || opResponse.anchor?.i || opResponse.registry?.regk,
          ...opResponse
        };
        console.log('Created registry object from operation:', registryFromOp);
        return registryFromOp;
      }
    }

    // Different KERIA versions might use different property names
    const registry = registries.find((r: any) =>
      r.name === registryName ||
      r.registryName === registryName ||
      r.rgy === registryName ||  // Try other possible property names
      r.ri === registryName
    );

    if (!registry) {
      console.error('Available registries:', registries);
      console.error('Registry property names found:', registries.map(r => Object.keys(r)));
      throw new Error(`Registry "${registryName}" not found after creation attempt. Available registries: ${JSON.stringify(registries)}`);
    }

    return registry;
  }

  async listRegistries(aidAlias: string): Promise<Registry[]> {
    if (!this.keriaService.isClientReady()) {
      throw new Error('KERIA service not ready. Please ensure it is properly initialized and connected.');
    }
    const client = this.keriaService.getClientOrThrow();

    console.log('Listing registries for AID alias:', aidAlias);

    try {
      const result = await client.registries().list(aidAlias);
      console.log('Raw registry list result:', result);
      console.log('Result type:', typeof result);
      console.log('Result keys:', result ? Object.keys(result) : 'null/undefined');

      // Handle different response formats
      if (Array.isArray(result)) {
        console.log('Result is array with length:', result.length);
        return result;
      } else if (result && typeof result === 'object' && 'registries' in result) {
        console.log('Result has registries property:', result.registries);
        return result.registries || [];
      } else if (result && typeof result === 'object') {
        console.log('Result is object, checking all properties:', Object.entries(result));
        // Try to find registry data in other possible property names
        const possibleArrays = Object.values(result).filter(Array.isArray);
        if (possibleArrays.length > 0) {
          console.log('Found possible registry array:', possibleArrays[0]);
          return possibleArrays[0] as Registry[];
        }
      }

      console.log('No registries found in result, returning empty array');
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
    if (!this.keriaService.isClientReady()) {
      throw new Error('KERIA service not ready. Please ensure it is properly initialized and connected.');
    }
    const client = this.keriaService.getClientOrThrow();

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
    if (!this.keriaService.isClientReady()) {
      throw new Error('KERIA service not ready. Please ensure it is properly initialized and connected.');
    }
    const client = this.keriaService.getClientOrThrow();

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
    if (!this.keriaService.isClientReady()) {
      throw new Error('KERIA service not ready. Please ensure it is properly initialized and connected.');
    }
    const client = this.keriaService.getClientOrThrow();

    return await (client.credentials() as any).list(aidAlias);
  }

  // High-level helper methods for complete workflows

  /**
   * Creates a complete issuer workflow: QVI + registry
   */
  async createIssuerWithRegistry(qviAlias: string, registryName: string): Promise<{
    qvi: { aid: any; agentEndRole: string };
    registry: Registry;
  }> {
    // Create QVI using the KeriaService helper
    const qvi = await this.keriaService.createQVI(qviAlias);

    // Create registry
    const registry = await this.createRegistry(qviAlias, registryName);

    return { qvi, registry };
  }

  /**
   * Issues a VLEI credential with complete workflow
   */
  async issueVLEIWorkflow(params: {
    issuerAlias: string;
    holderAid: string;
    registryName: string;
    schemaSaid: string;
    vleiData: { lei: string; entityName: string; entityType: string;[key: string]: any };
  }): Promise<{
    credential: any;
    operation: any;
    grant?: any;
  }> {
    // Get the registry for the issuer
    const registries = await this.listRegistries(params.issuerAlias);
    const registry = registries.find(r =>
      r.name === params.registryName || r.registryName === params.registryName
    );

    if (!registry) {
      throw new Error(`Registry ${params.registryName} not found for issuer ${params.issuerAlias}`);
    }

    // Issue the credential
    const { credential, operation } = await this.issueVLEI(
      params.issuerAlias,
      registry.regk,
      params.schemaSaid,
      params.holderAid,
      params.vleiData
    );

    // Grant the credential to the holder
    const grantOperation = await this.grantCredential(
      params.issuerAlias,
      credential,
      params.holderAid
    );

    return {
      credential,
      operation,
      grant: grantOperation
    };
  }

  async getCredential(said: string): Promise<any> {
    if (!this.keriaService.isClientReady()) {
      throw new Error('KERIA service not ready. Please ensure it is properly initialized and connected.');
    }
    const client = this.keriaService.getClientOrThrow();

    return await client.credentials().get(said);
  }

  async getNotifications(route?: string): Promise<any[]> {
    if (!this.keriaService.isClientReady()) {
      throw new Error('KERIA service not ready. Please ensure it is properly initialized and connected.');
    }
    const client = this.keriaService.getClientOrThrow();

    const allNotifications = await client.notifications().list();

    if (route) {
      return allNotifications.notes.filter((n: any) => n.a.r === route && !n.r);
    }

    return allNotifications.notes;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    if (!this.keriaService.isClientReady()) {
      throw new Error('KERIA service not ready. Please ensure it is properly initialized and connected.');
    }
    const client = this.keriaService.getClientOrThrow();

    await client.notifications().mark(notificationId);
  }

  async deleteNotification(notificationId: string): Promise<void> {
    if (!this.keriaService.isClientReady()) {
      throw new Error('KERIA service not ready. Please ensure it is properly initialized and connected.');
    }
    const client = this.keriaService.getClientOrThrow();

    await client.notifications().delete(notificationId);
  }

  async admitGrant(
    senderAlias: string,
    grantSaid: string,
    recipientAid: string
  ): Promise<Operation> {
    if (!this.keriaService.isClientReady()) {
      throw new Error('KERIA service not ready. Please ensure it is properly initialized and connected.');
    }
    const client = this.keriaService.getClientOrThrow();

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

  async issueCredential(params: {
    issuerAlias: string;
    holderAid: string;
    registryName: string;
    schemaId: string;
    attributes: Record<string, any>;
  }): Promise<{ said: string; credential: any }> {
    if (!this.keriaService.isClientReady()) {
      throw new Error('KERIA service not ready. Please ensure it is properly initialized and connected.');
    }
    const client = this.keriaService.getClientOrThrow();

    // Find the registry
    const registries = await this.listRegistries(params.issuerAlias);
    const registry = registries.find(r => r.name === params.registryName);
    if (!registry) {
      throw new Error(`Registry ${params.registryName} not found`);
    }

    const issueResult = await client.credentials().issue(params.issuerAlias, {
      ri: registry.regk,
      s: params.schemaId,
      a: {
        i: params.holderAid,
        dt: new Date().toISOString(),
        ...params.attributes
      }
    });

    const operation: Operation = typeof (issueResult as any).op === 'function'
      ? await (issueResult as any).op()
      : (issueResult as any);

    await this.keriaService.waitForOperation(operation);
    await this.keriaService.deleteOperation(operation.name);

    // Return the credential SAID and data
    const result = issueResult as any;
    return {
      said: result.d || result.acdc?.d || operation.response?.d,
      credential: result.acdc || result
    };
  }
}

// Create singleton instance
let credentialServiceInstance: CredentialService | null = null;

export const createCredentialService = (keriaService: KeriaService): CredentialService => {
  if (!credentialServiceInstance) {
    credentialServiceInstance = new CredentialService(keriaService);
  }
  return credentialServiceInstance;
};