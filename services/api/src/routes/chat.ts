import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import Anthropic from '@anthropic-ai/sdk'
import { ChatRequest } from '@pneuma/types'
import type { Env } from '../types'
import { getSupabase } from '../lib/supabase'
import { loadTopMemories, extractAndSaveMemories } from '../lib/memory'
import { buildSystemPrompt } from '../lib/context'

const app = new Hono<{ Bindings: Env; Variables: { userId: string; token: string } }>()

app.post('/', zValidator('json', ChatRequest), async (c) => {
  const userId = c.get('userId' as never) as string
  const { conversationId, message, deviceId } = c.req.valid('json')
  const sb = getSupabase(c.env)

  // Load user profile for context
  const { data: profile } = await sb
    .from('user_profiles')
    .select('display_name, timezone')
    .eq('id', userId)
    .single()

  // Load device platform
  const { data: device } = await sb
    .from('devices')
    .select('platform')
    .eq('id', deviceId)
    .eq('user_id', userId)
    .single()

  // Ensure conversation exists
  let convId = conversationId
  if (!convId) {
    const { data: conv } = await sb
      .from('conversations')
      .insert({ user_id: userId, device_id: deviceId })
      .select('id')
      .single()
    convId = conv!.id
  }

  // Load recent messages for context window (~20 messages)
  const { data: history } = await sb
    .from('messages')
    .select('role, content')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: false })
    .limit(20)

  const recentMessages = (history ?? []).reverse()

  // Load memories
  const memories = await loadTopMemories(sb, userId)

  const systemPrompt = buildSystemPrompt({
    displayName: profile?.display_name ?? undefined,
    timezone: profile?.timezone ?? 'UTC',
    platform: device?.platform ?? undefined,
    memories,
  })

  // Save the user message
  const { data: userMsg } = await sb
    .from('messages')
    .insert({ conversation_id: convId, user_id: userId, role: 'user', content: message })
    .select('id')
    .single()

  // Stream response via SSE
  const anthropic = new Anthropic({ apiKey: c.env.ANTHROPIC_API_KEY })

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      let fullReply = ''
      let inputTokens = 0
      let outputTokens = 0

      try {
        const messageStream = anthropic.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 2048,
          system: systemPrompt,
          messages: [
            ...recentMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
            { role: 'user', content: message },
          ],
        })

        for await (const event of messageStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            fullReply += event.delta.text
            const chunk = JSON.stringify({ type: 'delta', content: event.delta.text })
            controller.enqueue(enc.encode(`data: ${chunk}\n\n`))
          }
          if (event.type === 'message_delta' && event.usage) {
            outputTokens = event.usage.output_tokens
          }
          if (event.type === 'message_start' && event.message.usage) {
            inputTokens = event.message.usage.input_tokens
          }
        }

        // Save assistant message
        const { data: assistantMsg } = await sb
          .from('messages')
          .insert({
            conversation_id: convId,
            user_id: userId,
            role: 'assistant',
            content: fullReply,
            tokens_used: inputTokens + outputTokens,
          })
          .select('id')
          .single()

        const doneChunk = JSON.stringify({
          type: 'done',
          conversationId: convId,
          messageId: assistantMsg!.id,
          tokensUsed: inputTokens + outputTokens,
        })
        controller.enqueue(enc.encode(`data: ${doneChunk}\n\n`))
        controller.enqueue(enc.encode('data: [DONE]\n\n'))

        // Async memory extraction — doesn't block the response
        c.executionCtx.waitUntil(
          extractAndSaveMemories(
            sb,
            userId,
            userMsg!.id,
            message,
            fullReply,
            c.env.ANTHROPIC_API_KEY,
          ),
        )
      } catch (err) {
        const errChunk = JSON.stringify({ type: 'error', message: String(err) })
        controller.enqueue(enc.encode(`data: ${errChunk}\n\n`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  })
})

export { app as chatRoute }
