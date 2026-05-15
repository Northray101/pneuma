import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { DeviceAction } from '@pneuma/types'

const exec = promisify(execFile)

export async function runMacAction(action: DeviceAction): Promise<string> {
  switch (action.action) {
    case 'open_app': {
      const app = String(action.params['app'] ?? '')
      if (!app) throw new Error('open_app requires params.app')
      await exec('open', ['-a', app])
      return `Opened ${app}`
    }

    case 'run_shell': {
      const cmd = String(action.params['command'] ?? '')
      if (!cmd) throw new Error('run_shell requires params.command')
      const { stdout } = await exec('/bin/sh', ['-c', cmd])
      return stdout.trim()
    }

    case 'get_clipboard': {
      const { stdout } = await exec('pbpaste', [])
      return stdout
    }

    case 'set_clipboard': {
      const text = String(action.params['text'] ?? '')
      await exec('pbcopy', [], { input: text } as Parameters<typeof exec>[2])
      return 'Clipboard updated'
    }

    case 'set_volume': {
      const level = Number(action.params['level'] ?? 50)
      await exec('osascript', ['-e', `set volume output volume ${level}`])
      return `Volume set to ${level}`
    }

    case 'set_brightness': {
      const level = Number(action.params['level'] ?? 50) / 100
      await exec('osascript', ['-e', `tell application "System Events" to set brightness of every display to ${level}`])
      return `Brightness set to ${action.params['level']}%`
    }

    case 'lock_screen': {
      await exec('pmset', ['displaysleepnow'])
      return 'Screen locked'
    }

    default:
      throw new Error(`Unknown action: ${action.action}`)
  }
}
