import { handleCors, json, error } from '../_shared/cors.ts'
import { authenticate, getSupabaseAdmin } from '../_shared/auth.ts'

Deno.serve(async (req) => {
  const preflight = handleCors(req)
  if (preflight) return preflight

  const user = await authenticate(req)
  if (!user) return error('Unauthorized', 401)

  const sb = getSupabaseAdmin()
  const url = new URL(req.url)
  const action = url.pathname.split('/').pop() // 'delta' or 'ping'

  if (req.method === 'POST' && action === 'ping') {
    const { deviceId } = (await req.json()) as { deviceId: string }
    if (!deviceId) return error('deviceId required')

    await sb
      .from('devices')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', deviceId)
      .eq('user_id', user.userId)

    return json({ ok: true })
  }

  if (req.method === 'GET' && action === 'delta') {
    const deviceId = url.searchParams.get('deviceId')
    if (!deviceId) return error('deviceId required')

    const { data: device } = await sb
      .from('devices')
      .select('id')
      .eq('id', deviceId)
      .eq('user_id', user.userId)
      .single()

    if (!device) return error('Device not found', 404)

    // Get or create sync cursor
    let { data: cursor } = await sb
      .from('sync_cursors')
      .select('last_message_at, last_memory_at')
      .eq('device_id', deviceId)
      .single()

    if (!cursor) {
      const epoch = new Date(0).toISOString()
      await sb.from('sync_cursors').insert({
        device_id: deviceId,
        user_id: user.userId,
        last_message_at: epoch,
        last_memory_at: epoch,
      })
      cursor = { last_message_at: epoch, last_memory_at: epoch }
    }

    const now = new Date().toISOString()

    const [messagesRes, memoriesRes] = await Promise.all([
      sb
        .from('messages')
        .select('id, conversation_id, role, content, created_at')
        .eq('user_id', user.userId)
        .gt('created_at', cursor.last_message_at)
        .order('created_at'),
      sb
        .from('memories')
        .select('id, kind, content, importance, updated_at')
        .eq('user_id', user.userId)
        .gt('updated_at', cursor.last_memory_at)
        .order('updated_at'),
    ])

    await sb
      .from('sync_cursors')
      .update({ last_message_at: now, last_memory_at: now, updated_at: now })
      .eq('device_id', deviceId)

    return json({
      messages: messagesRes.data ?? [],
      memories: memoriesRes.data ?? [],
    })
  }

  return error('Not found', 404)
})
