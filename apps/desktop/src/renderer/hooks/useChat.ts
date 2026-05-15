import { useState, useCallback, useRef } from 'react'
import type { Message } from '@pneuma/types'
import { createPneumaClient } from '@pneuma/sdk'

interface UseChatOptions {
  apiUrl: string
  getToken: () => Promise<string>
  deviceId: string
}

export function useChat({ apiUrl, getToken, deviceId }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([])
  const [streaming, setStreaming] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const clientRef = useRef(createPneumaClient({ baseUrl: apiUrl, getToken }))

  const send = useCallback(
    async (content: string) => {
      const userMsg: Message = {
        id: crypto.randomUUID(),
        conversationId: conversationId ?? '',
        userId: '',
        role: 'user',
        content,
        tokensUsed: null,
        metadata: {},
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMsg])
      setStreaming(true)

      const assistantId = crypto.randomUUID()
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          conversationId: conversationId ?? '',
          userId: '',
          role: 'assistant',
          content: '',
          tokensUsed: null,
          metadata: {},
          createdAt: new Date().toISOString(),
        },
      ])

      try {
        for await (const chunk of clientRef.current.chat.send({
          conversationId,
          message: content,
          deviceId,
        })) {
          if (chunk.type === 'delta') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + chunk.content } : m,
              ),
            )
          }
          if (chunk.type === 'done') {
            setConversationId(chunk.conversationId)
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, id: chunk.messageId, tokensUsed: chunk.tokensUsed }
                  : m,
              ),
            )
          }
        }
      } finally {
        setStreaming(false)
      }
    },
    [conversationId, deviceId],
  )

  return { messages, streaming, send }
}
