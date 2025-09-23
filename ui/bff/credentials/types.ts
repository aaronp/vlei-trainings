import { t } from 'elysia';

export interface IssueCredentialRequest {
  issuer: string;
  subject: string;
  schemaSaid: string;
  claims: Record<string, any>;
  edges?: {
    assertedBy?: string;
    authorizes?: string;
    chain?: string[];
  };
  status?: {
    tel: string;
    method: 'issue' | 'revoke' | 'suspend';
  };
}

export interface IssueCredentialResponse {
  id: string;
  jwt?: string;
  acdc: any;
  anchors: {
    kel?: string;
    tel?: string;
  };
}

// Request Schemas
export const IssueCredentialRequestSchema = t.Object({
  issuer: t.String(),
  subject: t.String(),
  schemaSaid: t.String(),
  claims: t.Record(t.String(), t.Any()),
  edges: t.Optional(t.Object({
    assertedBy: t.Optional(t.String()),
    authorizes: t.Optional(t.String()),
    chain: t.Optional(t.Array(t.String()))
  })),
  status: t.Optional(t.Object({
    tel: t.String({ default: 'internal' }),
    method: t.Union([t.Literal('issue'), t.Literal('revoke'), t.Literal('suspend')], { default: 'issue' })
  }))
});

// Response Schemas
export const IssueCredentialResponseSchema = t.Object({
  id: t.String(),
  jwt: t.Optional(t.String()),
  acdc: t.Any(),
  anchors: t.Object({
    kel: t.Optional(t.String()),
    tel: t.Optional(t.String())
  })
});