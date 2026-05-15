import { useState, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { PNEUMA_API_URL as API_URL } from '../config'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'error'
  content: string
}

type Chunk =
  | { type: 'delta'; content: string }
  | { type: 'done'; conversationId: string; messageId: string }
  | { type: 'error'; message: string }

async function* streamChat(
  message: string,
  deviceId: string,
  conversationId: string | undefined,
  token: string,
): AsyncGenerator<Chunk> {
  let res: Response
  try {
    res = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message, deviceId, conversationId }),
    })
  } catch (e) {
    yield { type: 'error', message: 'Could not reach the server. Check your connection.' }
    return
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    yield {
      type: 'error',
      message:
        res.status === 401
          ? 'Session expired — please sign out and back in.'
          : res.status === 404
          ? 'Chat function not deployed yet. Deploy Supabase Edge Functions first.'
          : `Server error ${res.status}${text ? ': ' + text : ''}`,
    }
    return
  }

  if (!res.body) {
    yield { type: 'error', message: 'Empty response from server.' }
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6).trim()
      if (raw === '[DONE]') return
      try {
        yield JSON.parse(raw) as Chunk
      } catch {
        // skip malformed chunk
      }
    }
  }
}

export function useChat(deviceId: string, session: Session) {
  const [messages, setMessages] = useState<Message[]>([])
  const [streaming, setStreaming] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()

  const send = useCallback(
    async (content: string) => {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'user', content },
      ])
      setStreaming(true)

      const assistantId = crypto.randomUUID()
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '' },
      ])

      try {
        for await (const chunk of streamChat(
          content,
          deviceId,
          conversationId,
          session.access_token,
        )) {
          if (chunk.type === 'delta') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + chunk.content }
                  : m,
              ),
            )
          }
          if (chunk.type === 'done') {
            setConversationId(chunk.conversationId)
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, id: chunk.messageId } : m,
              ),
            )
          }
          if (chunk.type === 'error') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, role: 'error', content: chunk.message }
                  : m,
              ),
            )
          }
        }
      } catch (e) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  role: 'error',
                  content: e instanceof Error ? e.message : 'Something went wrong.',
                }
              : m,
          ),
        )
      } finally {
        setStreaming(false)
      }
    },
    [conversationId, deviceId, session.access_token],
  )

  return { messages, streaming, send }
}
