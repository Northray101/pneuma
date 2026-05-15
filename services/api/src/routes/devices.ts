import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { RegisterDeviceInput } from '@pneuma/types'
import type { Env } from '../types'
import { getSupabase } from '../lib/supabase'

const app = new Hono<{ Bindings: Env; Variables: { userId: string } }>()

app.get('/', async (c) => {
  const userId = c.get('userId' as never) as string
  const sb = getSupabase(c.env)

  const { data, error } = await sb
    .from('devices')
    .select('*')
    .eq('user_id', userId)
    .order('last_seen_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

app.post('/register', zValidator('json', RegisterDeviceInput), async (c) => {
  const userId = c.get('userId' as never) as string
  const input = c.req.valid('json')
  const sb = getSupabase(c.env)

  const { data, error } = await sb
    .from('devices')
    .upsert(
      { user_id: userId, ...input, last_seen_at: new Date().toISOString() },
      { onConflict: 'user_id,fingerprint' },
    )
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

app.patch('/:id', zValidator('json', z.object({ name: z.string().min(1).max(100) })), async (c) => {
  const userId = c.get('userId' as never) as string
  const { id } = c.req.param()
  const { name } = c.req.valid('json')
  const sb = getSupabase(c.env)

  const { data, error } = await sb
    .from('devices')
    .update({ name })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

export { app as devicesRoute }
