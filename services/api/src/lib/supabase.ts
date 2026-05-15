import { createClient } from '@supabase/supabase-js'
import type { Env } from '../types'

export function getSupabase(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
}

export async function verifyToken(
  env: Env,
  token: string,
): Promise<{ userId: string } | null> {
  const sb = getSupabase(env)
  const { data, error } = await sb.auth.getUser(token)
  if (error || !data.user) return null
  return { userId: data.user.id }
}
