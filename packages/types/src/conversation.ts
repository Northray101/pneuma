import { z } from 'zod'

export const MessageRole = z.enum(['user', 'assistant'])
export type MessageRole = z.infer<typeof MessageRole>

export const Message = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  userId: z.string().uuid(),
  role: MessageRole,
  content: z.string(),
  tokensUsed: z.number().int().nullable(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
})
export type Message = z.infer<typeof Message>

export const Conversation = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  deviceId: z.string().uuid().nullable(),
  title: z.string().nullable(),
  archived: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type Conversation = z.infer<typeof Conversation>

export const DeviceAction = z.object({
  action: z.string(),
  platform: z.enum(['mac', 'windows']),
  params: z.record(z.unknown()),
})
export type DeviceAction = z.infer<typeof DeviceAction>
