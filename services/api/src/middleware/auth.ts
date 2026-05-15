import type { Context, Next } from 'hono'
import type { Env } from '../types'
import { verifyToken } from '../lib/supabase'

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = header.slice(7)
  const result = await verifyToken(c.env, token)
  if (!result) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  c.set('userId' as never, result.userId)
  c.set('token' as never, token)
  await next()
}
