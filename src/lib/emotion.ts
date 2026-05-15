import { MOODS, DEFAULT_MOOD } from '../theme'
import type { MoodName, MoodVisual } from '../theme'

export interface Emotion {
  emotion: string
  valence: number
  arousal: number
}

export interface EmotionVisual {
  name: MoodName
  hue: number
  sat: number
  light: number
  valence: number
  arousal: number
  motion: { breathe: number; disp: number }
}

function isMoodName(n: string): n is MoodName {
  return Object.prototype.hasOwnProperty.call(MOODS, n)
}

export function toEmotionVisual(e: Emotion): EmotionVisual {
  const name: MoodName = isMoodName(e.emotion) ? e.emotion : DEFAULT_MOOD
  const m: MoodVisual = MOODS[name]
  return {
    name,
    hue: m.hue,
    sat: m.sat,
    light: m.light,
    valence: e.valence,
    arousal: e.arousal,
    motion: m.motion,
  }
}

export const DEFAULT_EMOTION_VISUAL: EmotionVisual = toEmotionVisual({
  emotion: DEFAULT_MOOD,
  valence: MOODS[DEFAULT_MOOD].valence,
  arousal: MOODS[DEFAULT_MOOD].arousal,
})
