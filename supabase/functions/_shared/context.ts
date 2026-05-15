import type { MemoryRow } from './memory.ts'

interface ContextOptions {
  displayName?: string
  timezone?: string
  platform?: string
  memories: MemoryRow[]
  hasVision?: boolean
}

const KIND_ORDER: Record<string, number> = {
  instruction: 0,
  preference: 1,
  fact: 2,
  habit: 3,
  context: 4,
}

export function buildSystemPrompt(opts: ContextOptions): string {
  const { displayName, timezone = 'UTC', platform, memories, hasVision = false } = opts

  const memoryBlock =
    memories.length > 0
      ? memories
          .sort((a, b) => {
            const diff = (KIND_ORDER[a.kind] ?? 5) - (KIND_ORDER[b.kind] ?? 5)
            return diff !== 0 ? diff : b.importance - a.importance
          })
          .map((m) => `[${m.kind}] ${m.content}`)
          .join('\n')
      : 'No memories yet.'

  const deviceBlock =
    platform === 'mac'
      ? 'Can run AppleScript and shell commands on the user\'s Mac via device actions.'
      : platform === 'windows'
        ? 'Can run PowerShell commands on the user\'s Windows PC via device actions.'
        : 'No device control available in this session.'

  const modalityNote = hasVision ? ' You can analyze images the user sends.' : ''

  return `You are Pneuma, a personal assistant${displayName ? ` for ${displayName}` : ''}.${modalityNote}
Today: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Timezone: ${timezone}.${platform ? ` Device: ${platform}.` : ''}

=== ABOUT THE USER ===
${memoryBlock}

=== DEVICE CAPABILITIES ===
${deviceBlock}
When a device action is needed, include a JSON block in this format:
\`\`\`action
{"action":"<action_name>","platform":"${platform ?? 'unknown'}","params":{}}
\`\`\`
Available actions: open_app, run_shell, get_clipboard, set_clipboard, set_volume, set_brightness (mac only), lock_screen.

=== BEHAVIOR ===
- Answer directly. Lead with the answer, context after.
- Be brief. One sentence if it fits.
- Never say "certainly", "of course", "great question", "absolutely", or any filler.
- When you don't know, say so plainly.
- If asked to remember something, confirm with one sentence.
- No markdown headers unless the user explicitly asks for a document.`
}
