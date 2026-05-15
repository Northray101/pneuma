import type { ChatRequest, ChatStreamChunk } from '@pneuma/types'
import type { PneumaClient } from './client'

export function createChatClient(http: PneumaClient) {
  return {
    async *send(input: ChatRequest): AsyncGenerator<ChatStreamChunk> {
      const res = await http.fetch('/chat', {
        method: 'POST',
        body: JSON.stringify(input),
      })

      if (!res.body) throw new Error('No response body')

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
            yield JSON.parse(raw) as ChatStreamChunk
          } catch {
            // malformed chunk — skip
          }
        }
      }
    },
  }
}
