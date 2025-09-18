export interface KeriConfig {
  adminUrl: string;
  bootUrl: string;
}

export interface ClientState {
  controller: {
    state: {
      i: string; // Client AID prefix
      k: string[]; // Current keys
      n: string[]; // Next keys digest
    };
  };
  agent: {
    i: string; // Agent AID prefix
    et: string; // Event type (should be 'dip' for delegated inception)
    di: string; // Delegator (should match Client AID)
  };
}

export interface AID {
  i: string; // AID prefix
  name: string; // Human-readable alias
}

export interface Credential {
  said: string;
  schema: string;
  issuer: string;
  recipient: string;
  status: string;
  issuedAt: string;
  data: Record<string, any>;
}

export interface VLEICredential extends Credential {
  lei: string;
  entityName: string;
  entityType: string;
}

export interface Operation {
  name: string;
  done: boolean;
  error?: any;
  response?: any;
  metadata?: {
    pre: string;
    sn: number;
  };
}