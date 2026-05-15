import { z } from 'zod'

export const Platform = z.enum(['mac', 'windows', 'cli'])
export type Platform = z.infer<typeof Platform>

export const Device = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(100),
  platform: Platform,
  fingerprint: z.string(),
  lastSeenAt: z.string().datetime(),
  createdAt: z.string().datetime(),
})
export type Device = z.infer<typeof Device>

export const RegisterDeviceInput = z.object({
  name: z.string().min(1).max(100),
  platform: Platform,
  fingerprint: z.string().min(1),
})
export type RegisterDeviceInput = z.infer<typeof RegisterDeviceInput>
