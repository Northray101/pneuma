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

// Parses a single line of the form: <<mood {"emotion":"curious","valence":0.4,"arousal":0.6}>>
// Returns a validated, clamped Emotion or null if the line isn't a valid tag.
export function parseMoodTag(line: string): Emotion | null {
  const m = line.match(/^\s*<<mood\s+(\{.*\})\s*>>\s*$/)
  if (!m) return null
  try {
    const o = JSON.parse(m[1]) as Record<string, unknown>
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
