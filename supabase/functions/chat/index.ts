import { corsHeaders, handleCors, error } from '../_shared/cors.ts'
import { authenticate, getSupabaseAdmin } from '../_shared/auth.ts'
import { loadTopMemories, extractAndSaveMemories } from '../_shared/memory.ts'
import { buildSystemPrompt } from '../_shared/context.ts'
import { DEFAULT_EMOTION, extractMoodFromBuffer } from '../_shared/emotion.ts'
import type { Emotion } from '../_shared/emotion.ts'
import { buildLiveContext } from '../_shared/tools.ts'
import {
  nvidiaStream,
  buildUserContent,
  DEFAULT_TEXT_MODEL,
  DEFAULT_VISION_MODEL,
} from '../_shared/nvidia.ts'

Deno.serve(async (req) => {
  const preflight = handleCors(req)
  if (preflight) return preflight

  try {
    const user = await authenticate(req)
    if (!user) return error('Unauthorized', 401)

    let body: {
      conversationId?: string
      message: string
      deviceId: string
      imageUrl?: string
      model?: string
    }
    try {
      body = await req.json()
    } catch {
      return error('Invalid JSON body', 400)
    }

    const { conversationId, message, deviceId, imageUrl, model } = body

    if (!message || !deviceId) return error('message and deviceId are required')

    const sb = getSupabaseAdmin()

    // Get client IP for live context (weather / search)
    const clientIp =
      (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      ''

    // Start live context fetch (runs concurrently with DB queries below)
    const liveContextPromise = buildLiveContext(message, clientIp)

    // Load user profile, device, and memories concurrently
    const [profileRes, deviceRes, memories] = await Promise.all([
      sb.from('user_profiles').select('display_name, timezone').eq('id', user.userId).single(),
      sb.from('devices').select('id, platform').eq('fingerprint', deviceId).eq('user_id', user.userId).single(),
      loadTopMemories(sb, user.userId),
    ])

    if (deviceRes.error || !deviceRes.data) {
      console.error('Device lookup failed:', deviceRes.error?.message, 'fingerprint:', deviceId)
      return error('Device not registered — please refresh and try again', 403)
    }

    const profile = profileRes.data
    const dbDeviceId = deviceRes.data.id as string
    const platform = deviceRes.data?.platform as string | undefined
    const hasVision = !!imageUrl

    // Create conversation if needed
    let convId = conversationId
    if (!convId) {
      const { data: conv, error: convErr } = await sb
        .from('conversations')
        .insert({ user_id: user.userId, device_id: dbDeviceId })
        .select('id')
        .single()
      if (convErr || !conv) {
        console.error('Failed to create conversation:', convErr?.message)
        return error('Failed to create conversation', 500)
      }
      convId = conv.id
    }

    // Recent message history for context window
    const { data: history } = await sb
      .from('messages')
      .select('role, content, metadata')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: false })
      .limit(20)

    const recentMessages = (history ?? []).reverse()

    // Seed the agent's emotion from the most recent assistant turn.
    const lastAssistant = [...recentMessages]
      .reverse()
      .find((m) => m.role === 'assistant')
    const seedEmotion: Emotion =
      ((lastAssistant?.metadata as Record<string, unknown> | undefined)
        ?.emotion as Emotion | undefined) ?? DEFAULT_EMOTION

    const liveContext = await liveContextPromise
    const systemPrompt = buildSystemPrompt({
      displayName: profile?.display_name ?? undefined,
      timezone: profile?.timezone ?? 'UTC',
      platform,
      memories,
      hasVision,
      emotion: seedEmotion,
      liveContext: liveContext || undefined,
    })

    // Save user message
    const { data: userMsg, error: userMsgErr } = await sb
      .from('messages')
      .insert({ conversation_id: convId, user_id: user.userId, role: 'user', content: message })
      .select('id')
      .single()
    if (userMsgErr || !userMsg) {
      console.error('Failed to save user message:', userMsgErr?.message)
      return error('Failed to save message', 500)
    }

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

        // Mood-extraction state machine.
        // Buffers the opening of the stream until a complete <<mood ...>> tag
        // is found (or ruled out). Handles: single >, no trailing newline,
        // text on the same line — all edge cases the model commonly produces.
        let phase: 'BUFFERING' | 'STREAMING' = 'BUFFERING'
        let headBuf = ''
        let moodSent = false
        let finalEmotion: Emotion = seedEmotion
        const MOOD_PREFIX = '<<mood '
        const HEAD_CAP = 400
        const emitMood = (m: Emotion) => {
          finalEmotion = m
          send({ type: 'mood', emotion: m.emotion, valence: m.valence, arousal: m.arousal })
          moodSent = true
        }

        try {
          const nvidiaChunks = await nvidiaStream({
            model: selectedModel,
            max_tokens: 220,
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
            if (chunk.usage) {
              inputTokens = chunk.usage.prompt_tokens ?? 0
              outputTokens = chunk.usage.completion_tokens ?? 0
            }
            if (!delta) continue

            if (phase === 'BUFFERING') {
              headBuf += delta

              // Try flexible extraction: works even with single >, no newline, or
              // text immediately following the closing >
              const extracted = extractMoodFromBuffer(headBuf)
              if (extracted) {
                emitMood(extracted.emotion)
                if (extracted.rest) {
                  fullReply += extracted.rest
                  send({ type: 'delta', content: extracted.rest })
                }
                headBuf = ''
                phase = 'STREAMING'
                continue
              }

              // Flush if the buffer clearly can't become a mood tag
              const trimmed = headBuf.trimStart()
              const onWayToTag =
                trimmed.length === 0 ||
                MOOD_PREFIX.startsWith(trimmed.slice(0, Math.min(trimmed.length, MOOD_PREFIX.length))) ||
                trimmed.startsWith(MOOD_PREFIX)

              if (!onWayToTag || headBuf.length > HEAD_CAP) {
                emitMood(seedEmotion)
                fullReply += headBuf
                send({ type: 'delta', content: headBuf })
                headBuf = ''
                phase = 'STREAMING'
              }
              continue
            }

            fullReply += delta
            send({ type: 'delta', content: delta })
          }

          if (phase === 'BUFFERING') {
            // Stream ended while still buffering — try one last extraction
            const extracted = extractMoodFromBuffer(headBuf)
            if (!moodSent) emitMood(extracted?.emotion ?? seedEmotion)
            const visible = extracted ? extracted.rest : headBuf
            if (visible) {
              fullReply += visible
              send({ type: 'delta', content: visible })
            }
          }
          if (!moodSent) emitMood(seedEmotion)

          // Save assistant message
          const { data: assistantMsg, error: assistantMsgErr } = await sb
            .from('messages')
            .insert({
              conversation_id: convId,
              user_id: user.userId,
              role: 'assistant',
              content: fullReply,
              tokens_used: inputTokens + outputTokens,
              metadata: { model: selectedModel, emotion: finalEmotion },
            })
            .select('id')
            .single()

          if (assistantMsgErr || !assistantMsg) {
            console.error('Failed to save assistant message:', assistantMsgErr?.message)
          }

          send({
            type: 'done',
            conversationId: convId,
            messageId: assistantMsg?.id ?? crypto.randomUUID(),
            tokensUsed: inputTokens + outputTokens,
          })
          controller.enqueue(enc.encode('data: [DONE]\n\n'))

          // Async memory extraction — fire and forget
          EdgeRuntime.waitUntil(
            extractAndSaveMemories(sb, user.userId, userMsg.id, message, fullReply),
          )
        } catch (err) {
          console.error('Streaming error:', err)
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
  } catch (err) {
    console.error('Unhandled error in chat function:', err)
    return new Response(
      JSON.stringify({ error: `Internal server error: ${String(err)}` }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
