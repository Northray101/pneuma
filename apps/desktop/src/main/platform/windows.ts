import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { DeviceAction } from '@pneuma/types'

const exec = promisify(execFile)

function ps(script: string) {
  return exec('powershell', ['-NoProfile', '-NonInteractive', '-Command', script])
}

export async function runWindowsAction(action: DeviceAction): Promise<string> {
  switch (action.action) {
    case 'open_app': {
      const app = String(action.params['app'] ?? '')
      if (!app) throw new Error('open_app requires params.app')
      await ps(`Start-Process "${app}"`)
      return `Opened ${app}`
    }

    case 'run_shell': {
      const cmd = String(action.params['command'] ?? '')
      if (!cmd) throw new Error('run_shell requires params.command')
      const { stdout } = await ps(cmd)
      return stdout.trim()
    }

    case 'get_clipboard': {
      const { stdout } = await ps('Get-Clipboard')
      return stdout.trim()
    }

    case 'set_clipboard': {
      const text = String(action.params['text'] ?? '').replace(/'/g, "''")
      await ps(`Set-Clipboard -Value '${text}'`)
      return 'Clipboard updated'
    }

    case 'set_volume': {
      const level = Number(action.params['level'] ?? 50)
      const script = `
        $obj = New-Object -ComObject WScript.Shell
        for ($i = 0; $i -lt 50; $i++) { $obj.SendKeys([char]174) }
        $steps = [Math]::Round(${level} / 2)
        for ($i = 0; $i -lt $steps; $i++) { $obj.SendKeys([char]175) }
      `
      await ps(script)
      return `Volume set to ~${level}`
    }

    case 'lock_screen': {
      await ps('rundll32.exe user32.dll,LockWorkStation')
      return 'Screen locked'
    }

    default:
      throw new Error(`Unknown action: ${action.action}`)
  }
}
