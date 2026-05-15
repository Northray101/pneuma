import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { CreateMemoryInput, MemoryKind, UpdateMemoryInput } from '@pneuma/types'
import type { Env } from '../types'
import { getSupabase } from '../lib/supabase'

const app = new Hono<{ Bindings: Env; Variables: { userId: string } }>()

app.get('/', zValidator('query', z.object({ kind: MemoryKind.optional(), limit: z.coerce.number().max(100).default(50) })), async (c) => {
  const userId = c.get('userId' as never) as string
  const { kind, limit } = c.req.valid('query')
  const sb = getSupabase(c.env)

  let query = sb
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    .order('importance', { ascending: false })
    .limit(limit)

  if (kind) query = query.eq('kind', kind)

  const { data, error } = await query
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

app.post('/', zValidator('json', CreateMemoryInput), async (c) => {
  const userId = c.get('userId' as never) as string
  const input = c.req.valid('json')
  const sb = getSupabase(c.env)

  const { data, error } = await sb
    .from('memories')
    .insert({ user_id: userId, ...input })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

app.patch('/:id', zValidator('json', UpdateMemoryInput), async (c) => {
  const userId = c.get('userId' as never) as string
  const { id } = c.req.param()
  const input = c.req.valid('json')
  const sb = getSupabase(c.env)

  const { data, error } = await sb
    .from('memories')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

app.delete('/:id', async (c) => {
  const userId = c.get('userId' as never) as string
  const { id } = c.req.param()
  const sb = getSupabase(c.env)

  const { error } = await sb.from('memories').delete().eq('id', id).eq('user_id', userId)
  if (error) return c.json({ error: error.message }, 500)
  return new Response(null, { status: 204 })
})

export { app as memoryRoute }
