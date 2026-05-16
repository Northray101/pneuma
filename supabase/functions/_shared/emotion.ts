// Server-side emotion model. Deno can't import from src/, so the mood NAMES
// here must stay in sync with the canonical MOODS table in src/theme.ts.

export interface Emotion {
  emotion: string
  valence: number
  arousal: number
}

export const MOOD_NAMES = [
  'calm',
  'warm',
  'curious',
  'focused',
  'playful',
  'concerned',
  'bright',
] as const

export const DEFAULT_EMOTION: Emotion = {
  emotion: 'warm',
  valence: 0.25,
  arousal: 0.3,
}

export function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min
  return Math.min(max, Math.max(min, n))
}

// Strict parse: expects exactly <<mood {...}>> on its own line with nothing after.
export function parseMoodTag(line: string): Emotion | null {
  const m = line.match(/^\s*<<mood\s+(\{[^}]+\})\s*>+\s*$/)
  if (!m) return null
  return _parseEmotionJson(m[1])
}

// Flexible extract: handles single >, no trailing newline, or text on the same line.
// Returns { emotion, rest } where rest is any content after the closing > (may be empty).
export function extractMoodFromBuffer(
  buf: string,
): { emotion: Emotion; rest: string } | null {
  const m = buf.match(/^\s*<<mood\s+(\{[^}]+\})\s*>+\s*\n?([\s\S]*)$/)
  if (!m) return null
  const emotion = _parseEmotionJson(m[1])
  if (!emotion) return null
  return { emotion, rest: m[2] ?? '' }
}

function _parseEmotionJson(json: string): Emotion | null {
  try {
    const o = JSON.parse(json) as Record<string, unknown>
    const name = String(o.emotion ?? '').toLowerCase()
    if (!(MOOD_NAMES as readonly string[]).includes(name)) return null
    return {
      emotion: name,
      valence: clamp(Number(o.valence), -1, 1),
      arousal: clamp(Number(o.arousal), 0, 1),
    }
  } catch {
    return null
  }
}
