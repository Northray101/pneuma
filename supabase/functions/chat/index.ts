import { corsHeaders, handleCors, error } from '../_shared/cors.ts'
import { authenticate, getSupabaseAdmin } from '../_shared/auth.ts'
import { loadTopMemories, extractAndSaveMemories } from '../_shared/memory.ts'
import { buildSystemPrompt } from '../_shared/context.ts'
import {
  nvidiaStream,
  buildUserContent,
  DEFAULT_TEXT_MODEL,
  DEFAULT_VISION_MODEL,
} from '../_shared/nvidia.ts'

Deno.serve(async (req) => {
  const preflight = handleCors(req)
  if (preflight) return preflight

  const user = await authenticate(req)
  if (!user) return error('Unauthorized', 401)

  const body = await req.json()
  const { conversationId, message, deviceId, imageUrl, model } = body as {
    conversationId?: string
    message: string
    deviceId: string
    imageUrl?: string
    model?: string
  }

  if (!message || !deviceId) return error('message and deviceId are required')

  const sb = getSupabaseAdmin()

  // Load user profile, device, and memories concurrently
  const [profileRes, deviceRes, memories] = await Promise.all([
    sb.from('user_profiles').select('display_name, timezone').eq('id', user.userId).single(),
    sb.from('devices').select('platform').eq('id', deviceId).eq('user_id', user.userId).single(),
    loadTopMemories(sb, user.userId),
  ])

  const profile = profileRes.data
  const platform = deviceRes.data?.platform as string | undefined
  const hasVision = !!imageUrl

  // Create conversation if needed
  let convId = conversationId
  if (!convId) {
    const { data: conv } = await sb
      .from('conversations')
      .insert({ user_id: user.userId, device_id: deviceId })
      .select('id')
      .single()
    convId = conv!.id
  }

  // Recent message history for context window
  const { data: history } = await sb
    .from('messages')
    .select('role, content')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: false })
    .limit(20)

  const recentMessages = (history ?? []).reverse()

  const systemPrompt = buildSystemPrompt({
    displayName: profile?.display_name ?? undefined,
    timezone: profile?.timezone ?? 'UTC',
    platform,
    memories,
    hasVision,
  })

  // Save user message
  const { data: userMsg } = await sb
    .from('messages')
    .insert({ conversation_id: convId, user_id: user.userId, role: 'user', content: message })
    .select('id')
    .single()

  // Pick model: vision if image present, otherwise text
  const selectedModel = model ?? (hasVision ? DEFAULT_VISION_MODEL : DEFAULT_TEXT_MODEL)

  // Stream response
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      let fullReply = ''
      let inputTokens = 0
      let outputTokens = 0

      const send = (chunk: unknown) =>
        controller.enqueue(enc.encode(`data: ${JSON.stringify(chunk)}\n\n`))

      try {
        const nvidiaChunks = await nvidiaStream({
          model: selectedModel,
          max_tokens: 2048,
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            ...recentMessages.map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content as string,
            })),
            {
              role: 'user',
              content: buildUserContent(message, imageUrl),
            },
          ],
        })

        for await (const chunk of nvidiaChunks) {
          const delta = chunk.choices[0]?.delta?.content ?? ''
          if (delta) {
            fullReply += delta
            send({ type: 'delta', content: delta })
          }
          if (chunk.usage) {
            inputTokens = chunk.usage.prompt_tokens ?? 0
            outputTokens = chunk.usage.completion_tokens ?? 0
          }
        }

        // Save assistant message
        const { data: assistantMsg } = await sb
          .from('messages')
          .insert({
            conversation_id: convId,
            user_id: user.userId,
            role: 'assistant',
            content: fullReply,
            tokens_used: inputTokens + outputTokens,
            metadata: { model: selectedModel },
          })
          .select('id')
          .single()

        send({
          type: 'done',
          conversationId: convId,
          messageId: assistantMsg!.id,
          tokensUsed: inputTokens + outputTokens,
        })
        controller.enqueue(enc.encode('data: [DONE]\n\n'))

        // Async memory extraction — fire and forget
        EdgeRuntime.waitUntil(
          extractAndSaveMemories(sb, user.userId, userMsg!.id, message, fullReply),
        )
      } catch (err) {
        send({ type: 'error', message: String(err) })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
})
