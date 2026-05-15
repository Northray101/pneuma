import type { CreateMemoryInput, Memory, MemoryKind, UpdateMemoryInput } from '@pneuma/types'
import type { PneumaClient } from './client'

export function createMemoryClient(http: PneumaClient) {
  return {
    async list(opts?: { kind?: MemoryKind; limit?: number }): Promise<Memory[]> {
      const params = new URLSearchParams()
      if (opts?.kind) params.set('kind', opts.kind)
      if (opts?.limit) params.set('limit', String(opts.limit))
      const res = await http.fetch(`/memory?${params}`)
      return res.json()
    },

    async create(input: CreateMemoryInput): Promise<Memory> {
      const res = await http.fetch('/memory', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      return res.json()
    },

    async update(id: string, input: UpdateMemoryInput): Promise<Memory> {
      const res = await http.fetch(`/memory/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      })
      return res.json()
    },

    async delete(id: string): Promise<void> {
      await http.fetch(`/memory/${id}`, { method: 'DELETE' })
    },
  }
}
