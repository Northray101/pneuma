import { z } from 'zod'

export const ChatRequest = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1).max(10000),
  deviceId: z.string().uuid(),
})
export type ChatRequest = z.infer<typeof ChatRequest>

export const ChatStreamChunk = z.discriminatedUnion('type', [
  z.object({ type: z.literal('delta'), content: z.string() }),
  z.object({
    type: z.literal('done'),
    conversationId: z.string().uuid(),
    messageId: z.string().uuid(),
    tokensUsed: z.number().int(),
  }),
  z.object({ type: z.literal('error'), message: z.string() }),
])
export type ChatStreamChunk = z.infer<typeof ChatStreamChunk>

export const SyncDelta = z.object({
  messages: z.array(
    z.object({
      id: z.string().uuid(),
      conversationId: z.string().uuid(),
      role: z.enum(['user', 'assistant']),
      content: z.string(),
      createdAt: z.string().datetime(),
    }),
  ),
  memories: z.array(
    z.object({
      id: z.string().uuid(),
      kind: z.string(),
      content: z.string(),
      importance: z.number(),
      updatedAt: z.string().datetime(),
    }),
  ),
})
export type SyncDelta = z.infer<typeof SyncDelta>

export const PaginationQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().datetime().optional(),
})
export type PaginationQuery = z.infer<typeof PaginationQuery>
