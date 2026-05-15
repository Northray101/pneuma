import { corsHeaders, handleCors, json, error } from '../_shared/cors.ts'
import { authenticate, getSupabaseAdmin } from '../_shared/auth.ts'

Deno.serve(async (req) => {
  const preflight = handleCors(req)
  if (preflight) return preflight

  const user = await authenticate(req)
  if (!user) return error('Unauthorized', 401)

  const sb = getSupabaseAdmin()
  const url = new URL(req.url)
  const pathParts = url.pathname.split('/').filter(Boolean)
  const lastSegment = pathParts[pathParts.length - 1]
  const isRegister = lastSegment === 'register'
  const deviceId = !isRegister && lastSegment !== 'devices' ? lastSegment : null

  if (req.method === 'GET') {
    const { data, error: dbErr } = await sb
      .from('devices')
      .select('*')
      .eq('user_id', user.userId)
      .order('last_seen_at', { ascending: false })

    if (dbErr) return error(dbErr.message, 500)
    return json(data)
  }

  if (req.method === 'POST' && isRegister) {
    const { name, platform, fingerprint } = (await req.json()) as {
      name: string
      platform: string
      fingerprint: string
    }

    if (!name || !platform || !fingerprint) return error('name, platform, fingerprint required')

    const { data, error: dbErr } = await sb
      .from('devices')
      .upsert(
        { user_id: user.userId, name, platform, fingerprint, last_seen_at: new Date().toISOString() },
        { onConflict: 'user_id,fingerprint' },
      )
      .select()
      .single()

    if (dbErr) return error(dbErr.message, 500)
    return json(data, 201)
  }

  if (req.method === 'PATCH' && deviceId) {
    const { name } = (await req.json()) as { name: string }
    if (!name) return error('name required')

    const { data, error: dbErr } = await sb
      .from('devices')
      .update({ name })
      .eq('id', deviceId)
      .eq('user_id', user.userId)
      .select()
      .single()

    if (dbErr) return error(dbErr.message, 500)
    return json(data)
  }

  return error('Method not allowed', 405)
})
