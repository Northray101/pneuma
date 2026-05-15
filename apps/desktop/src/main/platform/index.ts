import { platform } from 'node:process'
import type { DeviceAction } from '@pneuma/types'

export async function runDeviceAction(action: DeviceAction): Promise<string> {
  if (platform === 'darwin') {
    const { runMacAction } = await import('./mac')
    return runMacAction(action)
  }
  if (platform === 'win32') {
    const { runWindowsAction } = await import('./windows')
    return runWindowsAction(action)
  }
  throw new Error(`Device control not supported on platform: ${platform}`)
}

export function getCurrentPlatform(): 'mac' | 'windows' | 'cli' {
  if (platform === 'darwin') return 'mac'
  if (platform === 'win32') return 'windows'
  return 'cli'
}
