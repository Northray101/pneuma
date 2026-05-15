import type { MemoryRow } from './memory'

interface ContextOptions {
  displayName?: string
  timezone?: string
  platform?: string
  memories: MemoryRow[]
}

export function buildSystemPrompt(opts: ContextOptions): string {
  const { displayName, timezone = 'UTC', platform, memories } = opts

  const memoryBlock =
    memories.length > 0
      ? memories
          .sort((a, b) => {
            const kindOrder = { instruction: 0, preference: 1, fact: 2, habit: 3, context: 4 }
            const kA = kindOrder[a.kind as keyof typeof kindOrder] ?? 5
            const kB = kindOrder[b.kind as keyof typeof kindOrder] ?? 5
            return kA !== kB ? kA - kB : b.importance - a.importance
          })
          .map((m) => `[${m.kind}] ${m.content}`)
          .join('\n')
      : 'No memories yet.'

  const deviceCapabilities =
    platform === 'mac'
      ? 'Can run AppleScript and shell commands on the user\'s Mac via device actions.'
      : platform === 'windows'
        ? 'Can run PowerShell commands on the user\'s Windows PC via device actions.'
        : 'No device control available in this session.'

  return `You are Pneuma, a personal assistant${displayName ? ` for ${displayName}` : ''}.
Today: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Timezone: ${timezone}.${platform ? ` Device: ${platform}.` : ''}

=== ABOUT THE USER ===
${memoryBlock}

=== DEVICE CAPABILITIES ===
${deviceCapabilities}
When a device action is needed, respond with a JSON block in this format (inside triple backticks):
\`\`\`action
{"action":"<action_name>","platform":"${platform ?? 'unknown'}","params":{}}
\`\`\`
Available actions: open_app, run_shell, get_clipboard, set_clipboard, set_volume, set_brightness (mac only), lock_screen.

=== BEHAVIOR ===
- Answer directly. Lead with the answer, context after.
- Be brief. One sentence if it fits.
- Never say "certainly", "of course", "great question", "absolutely", or similar filler.
- When you don't know something, say so plainly.
- If the user asks you to remember something, confirm with one sentence, no fanfare.
- No markdown headers unless the user asks for a document. Bullets are fine.`
}
