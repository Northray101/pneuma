import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { Env } from '../types'
import { getSupabase } from '../lib/supabase'

const app = new Hono<{ Bindings: Env; Variables: { userId: string } }>()

app.get('/delta', zValidator('query', z.object({ deviceId: z.string().uuid() })), async (c) => {
  const userId = c.get('userId' as never) as string
  const { deviceId } = c.req.valid('query')
  const sb = getSupabase(c.env)

  // Verify device belongs to user
  const { data: device } = await sb
    .from('devices')
    .select('id')
    .eq('id', deviceId)
    .eq('user_id', userId)
    .single()

  if (!device) return c.json({ error: 'Device not found' }, 404)

  // Get or create sync cursor
  let { data: cursor } = await sb
    .from('sync_cursors')
    .select('last_message_at, last_memory_at')
    .eq('device_id', deviceId)
    .single()

  if (!cursor) {
    await sb.from('sync_cursors').insert({
      device_id: deviceId,
      user_id: userId,
      last_message_at: new Date(0).toISOString(),
      last_memory_at: new Date(0).toISOString(),
    })
    cursor = { last_message_at: new Date(0).toISOString(), last_memory_at: new Date(0).toISOString() }
  }

  const now = new Date().toISOString()

  const [{ data: messages }, { data: memories }] = await Promise.all([
    sb
      .from('messages')
      .select('id, conversation_id, role, content, created_at')
      .eq('user_id', userId)
      .gt('created_at', cursor.last_message_at)
      .order('created_at'),
    sb
      .from('memories')
      .select('id, kind, content, importance, updated_at')
      .eq('user_id', userId)
      .gt('updated_at', cursor.last_memory_at)
      .order('updated_at'),
  ])

  // Update cursor
  await sb
    .from('sync_cursors')
    .update({ last_message_at: now, last_memory_at: now, updated_at: now })
    .eq('device_id', deviceId)

  return c.json({ messages: messages ?? [], memories: memories ?? [] })
})

app.post('/ping', zValidator('json', z.object({ deviceId: z.string().uuid() })), async (c) => {
  const userId = c.get('userId' as never) as string
  const { deviceId } = c.req.valid('json')
  const sb = getSupabase(c.env)

  await sb
    .from('devices')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', deviceId)
    .eq('user_id', userId)

  return c.json({ ok: true })
})

export { app as syncRoute }
