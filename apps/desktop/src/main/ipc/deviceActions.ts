import { ipcMain } from 'electron'
import { DeviceAction } from '@pneuma/types'
import { runDeviceAction } from '../platform/index'

export function registerDeviceActionHandlers() {
  ipcMain.handle('device:run-action', async (_event, rawAction: unknown) => {
    const parsed = DeviceAction.safeParse(rawAction)
    if (!parsed.success) {
      throw new Error(`Invalid action: ${parsed.error.message}`)
    }
    return runDeviceAction(parsed.data)
  })
}
