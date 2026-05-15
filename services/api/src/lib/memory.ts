import type { SupabaseClient } from '@supabase/supabase-js'

export interface MemoryRow {
  id: string
  kind: string
  content: string
  importance: number
  expires_at: string | null
}

export async function loadTopMemories(
  sb: SupabaseClient,
  userId: string,
  limit = 20,
): Promise<MemoryRow[]> {
  const { data } = await sb
    .from('memories')
    .select('id, kind, content, importance, expires_at')
    .eq('user_id', userId)
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    .order('importance', { ascending: false })
    .limit(limit)

  return (data as MemoryRow[]) ?? []
}

export async function extractAndSaveMemories(
  sb: SupabaseClient,
  userId: string,
  sourceMessageId: string,
  userMessage: string,
  assistantReply: string,
  anthropicKey: string,
): Promise<void> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey: anthropicKey })

  const res = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Extract any new facts, preferences, or instructions about the user from this exchange. Return a JSON array of objects with fields: kind (fact|preference|habit|instruction), content (plain text statement), importance (1-10). If nothing new, return [].

User: ${userMessage}
Assistant: ${assistantReply}`,
      },
    ],
  })

  const raw = res.content[0].type === 'text' ? res.content[0].text.trim() : '[]'
  let items: Array<{ kind: string; content: string; importance: number }> = []
  try {
    const match = raw.match(/\[[\s\S]*\]/)
    items = match ? JSON.parse(match[0]) : []
  } catch {
    return
  }

  if (items.length === 0) return

  await sb.from('memories').insert(
    items.map((item) => ({
      user_id: userId,
      kind: item.kind,
      content: item.content,
      importance: Math.min(10, Math.max(1, item.importance ?? 5)),
      source_msg_id: sourceMessageId,
    })),
  )
}
