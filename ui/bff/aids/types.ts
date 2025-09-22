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
