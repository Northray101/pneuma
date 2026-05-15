export { PneumaClient } from './client'
export type { PneumaClientOptions } from './client'
export { createChatClient } from './chat'
export { createMemoryClient } from './memory'
export { createSyncClient } from './sync'

import { PneumaClient, type PneumaClientOptions } from './client'
import { createChatClient } from './chat'
import { createMemoryClient } from './memory'
import { createSyncClient } from './sync'

export function createPneumaClient(options: PneumaClientOptions) {
  const http = new PneumaClient(options)
  return {
    chat: createChatClient(http),
    memory: createMemoryClient(http),
    sync: createSyncClient(http),
  }
}
