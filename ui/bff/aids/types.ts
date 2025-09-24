import { t } from 'elysia';

export interface CreateAIDRequest {
  alias: string;
  wits?: string[];
  transferable?: boolean;
  icount?: number;
  ncount?: number;
}

export interface AID {
  prefix: string;
  alias: string;
  transferable: boolean;
  state: any;
}


// Request Schemas
export const CreateAIDRequestSchema = t.Object({
  alias: t.String(),
  wits: t.Optional(t.Array(t.String())),
  transferable: t.Optional(t.Boolean({ default: true })),
  icount: t.Optional(t.Integer({ default: 1 })),
  ncount: t.Optional(t.Integer({ default: 1 }))
});


// Response Schemas
export const AIDSchema = t.Object({
  prefix: t.String(),
  alias: t.String(),
  transferable: t.Boolean(),
  state: t.Any()
});

export const CreateAIDResponseSchema = t.Object({
  aid: AIDSchema
});

// Sign Request and Response
export interface SignRequest {
  alias: string;
  text: string;
}

export interface SignResponse {
  signature: string;
}

// Verify Request and Response
export interface VerifyRequest {
  alias: string;
  text: string;
  signature: string;
  prefix?: string;
}

export interface VerifyResponse {
  valid: boolean;
  prefix: string;
}

// Rotate Request and Response
export interface RotateRequest {
  alias: string;
  count?: number;
  ncount?: number;
  wits?: string[];
  cuts?: string[];
  adds?: string[];
}

export interface RotateResponse {
  prefix: string;
  alias: string;
  sequence: number;
  publicKey: string;
}

// Request Schemas for new operations
export const SignRequestSchema = t.Object({
  alias: t.String(),
  text: t.String()
});

export const VerifyRequestSchema = t.Object({
  alias: t.String(),
  text: t.String(),
  signature: t.String(),
  prefix: t.Optional(t.String())
});

export const RotateRequestSchema = t.Object({
  alias: t.String(),
  count: t.Optional(t.Integer({ default: 1 })),
  ncount: t.Optional(t.Integer({ default: 1 })),
  wits: t.Optional(t.Array(t.String())),
  cuts: t.Optional(t.Array(t.String())),
  adds: t.Optional(t.Array(t.String()))
});

// Response Schemas for new operations
export const SignResponseSchema = t.Object({
  signature: t.String()
});

export const VerifyResponseSchema = t.Object({
  valid: t.Boolean(),
  prefix: t.String()
});

export const RotateResponseSchema = t.Object({
  prefix: t.String(),
  alias: t.String(),
  sequence: t.Integer(),
  publicKey: t.String()
});
