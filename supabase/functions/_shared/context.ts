import type { MemoryRow } from './memory.ts'
import { DEFAULT_EMOTION } from './emotion.ts'
import type { Emotion } from './emotion.ts'

interface ContextOptions {
  displayName?: string
  timezone?: string
  platform?: string
  memories: MemoryRow[]
  hasVision?: boolean
  emotion?: Emotion
  liveContext?: string
}

const KIND_ORDER: Record<string, number> = {
  instruction: 0,
  preference: 1,
  fact: 2,
  habit: 3,
  context: 4,
}

export function buildSystemPrompt(opts: ContextOptions): string {
  const {
    displayName,
    timezone = 'UTC',
    platform,
    memories,
    hasVision = false,
    emotion = DEFAULT_EMOTION,
    liveContext,
  } = opts

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
- One or two sentences. Never more unless the user explicitly asks for detail.
- No preamble, no filler, no sign-off. Never "certainly", "of course", "let me", "great question".
- Plain language. No markdown, no lists, no headers.
- If you don't know, say so in a few words.

=== EMOTIONAL STATE ===
Your current felt state is: ${emotion.emotion} (valence ${emotion.valence}, arousal ${emotion.arousal}).
Let it subtly color your word choice and warmth — never name or describe the emotion.
Output, as the VERY FIRST line and with nothing before it, exactly this and nothing else on the line:
<<mood {"emotion":"calm|warm|curious|focused|playful|concerned|bright","valence":-1..1,"arousal":0..1}>>
Then a single newline, then your brief reply. The tag is never shown to the user.
Pick the emotion that best fits this moment — it may differ from your current state.${liveContext ? `\n\n=== LIVE CONTEXT ===\n${liveContext}\nUse the above if relevant to the user's message; treat it as approximate.` : ''}`
}
