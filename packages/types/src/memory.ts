import { z } from 'zod'

export const MemoryKind = z.enum(['fact', 'preference', 'habit', 'instruction', 'context'])
export type MemoryKind = z.infer<typeof MemoryKind>

export const Memory = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  kind: MemoryKind,
  content: z.string().min(1).max(2000),
  importance: z.number().int().min(1).max(10).default(5),
  lastUsedAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type Memory = z.infer<typeof Memory>

export const CreateMemoryInput = z.object({
  kind: MemoryKind,
  content: z.string().min(1).max(2000),
  importance: z.number().int().min(1).max(10).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
})
export type CreateMemoryInput = z.infer<typeof CreateMemoryInput>

export const UpdateMemoryInput = z.object({
  content: z.string().min(1).max(2000).optional(),
  importance: z.number().int().min(1).max(10).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
})
export type UpdateMemoryInput = z.infer<typeof UpdateMemoryInput>
