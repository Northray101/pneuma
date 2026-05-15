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
  // path: /memory or /memory/:id
  const memoryId = pathParts[pathParts.length - 1] !== 'memory' ? pathParts[pathParts.length - 1] : null

  if (req.method === 'GET') {
    const kind = url.searchParams.get('kind')
    const limit = Math.min(100, parseInt(url.searchParams.get('limit') ?? '50', 10))

    let query = sb
      .from('memories')
      .select('*')
      .eq('user_id', user.userId)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .order('importance', { ascending: false })
      .limit(limit)

    if (kind) query = query.eq('kind', kind)

    const { data, error: dbErr } = await query
    if (dbErr) return error(dbErr.message, 500)
    return json(data)
  }

  if (req.method === 'POST') {
    const body = await req.json()
    const { kind, content, importance = 5, expiresAt } = body as {
      kind: string
      content: string
      importance?: number
      expiresAt?: string | null
    }

    if (!kind || !content) return error('kind and content are required')

    const { data, error: dbErr } = await sb
      .from('memories')
      .insert({
        user_id: user.userId,
        kind,
        content,
        importance: Math.min(10, Math.max(1, importance)),
        expires_at: expiresAt ?? null,
      })
      .select()
      .single()

    if (dbErr) return error(dbErr.message, 500)
    return json(data, 201)
  }

  if (req.method === 'PATCH' && memoryId) {
    const body = await req.json()
    const { content, importance, expiresAt } = body as {
      content?: string
      importance?: number
      expiresAt?: string | null
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (content !== undefined) update['content'] = content
    if (importance !== undefined) update['importance'] = Math.min(10, Math.max(1, importance))
    if (expiresAt !== undefined) update['expires_at'] = expiresAt

    const { data, error: dbErr } = await sb
      .from('memories')
      .update(update)
      .eq('id', memoryId)
      .eq('user_id', user.userId)
      .select()
      .single()

    if (dbErr) return error(dbErr.message, 500)
    return json(data)
  }

  if (req.method === 'DELETE' && memoryId) {
    const { error: dbErr } = await sb
      .from('memories')
      .delete()
      .eq('id', memoryId)
      .eq('user_id', user.userId)

    if (dbErr) return error(dbErr.message, 500)
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  return error('Method not allowed', 405)
})
