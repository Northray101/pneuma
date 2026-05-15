import type { SyncDelta } from '@pneuma/types'
import type { PneumaClient } from './client'

export function createSyncClient(http: PneumaClient) {
  return {
    async ping(deviceId: string): Promise<void> {
      await http.fetch('/sync/ping', {
        method: 'POST',
        body: JSON.stringify({ deviceId }),
      })
    },

    async delta(deviceId: string): Promise<SyncDelta> {
      const res = await http.fetch(`/sync/delta?deviceId=${deviceId}`)
      return res.json()
    },
  }
}
