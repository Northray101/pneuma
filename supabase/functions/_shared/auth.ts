import { createClient } from 'npm:@supabase/supabase-js@2'

export function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )
}

export async function authenticate(req: Request): Promise<{ userId: string } | null> {
  const header = req.headers.get('Authorization')
  if (!header?.startsWith('Bearer ')) return null

  const token = header.slice(7)
  const sb = getSupabaseAdmin()
  const { data, error } = await sb.auth.getUser(token)
  if (error || !data.user) return null

  return { userId: data.user.id }
}
