// Canonical mood table. The mood NAMES here must stay in sync with
// MOOD_NAMES in supabase/functions/_shared/emotion.ts.

export type MoodName =
  | 'calm'
  | 'warm'
  | 'curious'
  | 'focused'
  | 'playful'
  | 'concerned'
  | 'bright'

export interface MoodVisual {
  hue: number
  sat: number
  light: number
  valence: number
  arousal: number
  motion: { breathe: number; disp: number }
}

export const MOODS: Record<MoodName, MoodVisual> = {
  calm:      { hue: 195, sat: 16, light: 94, valence:  0.2, arousal: 0.2,  motion: { breathe: 8.0, disp: 16 } },
  warm:      { hue:  32, sat: 22, light: 94, valence:  0.3, arousal: 0.3,  motion: { breathe: 7.0, disp: 18 } },
  curious:   { hue: 158, sat: 20, light: 93, valence:  0.4, arousal: 0.55, motion: { breathe: 5.0, disp: 22 } },
  focused:   { hue: 210, sat: 14, light: 93, valence:  0.1, arousal: 0.45, motion: { breathe: 6.0, disp: 14 } },
  playful:   { hue:  45, sat: 26, light: 94, valence:  0.6, arousal: 0.7,  motion: { breathe: 3.6, disp: 26 } },
  concerned: { hue:  18, sat: 18, light: 92, valence: -0.3, arousal: 0.5,  motion: { breathe: 5.5, disp: 20 } },
  bright:    { hue:  52, sat: 24, light: 95, valence:  0.7, arousal: 0.65, motion: { breathe: 4.2, disp: 24 } },
}

export const DEFAULT_MOOD: MoodName = 'warm'

export const colors = {
  text: '#1A1A1A',
  mid: '#3A3A3A',
  muted: '#7A766F',
  faint: '#A8A39A',
  base: '#F7F5F2',
  error: '#B4503C',
}

// Light, restrained frosted-glass surfaces.
export const glass = {
  surface: 'rgba(255,255,255,0.55)',
  surfaceStrong: 'rgba(255,255,255,0.72)',
  border: 'rgba(255,255,255,0.75)',
  borderSubtle: 'rgba(120,110,95,0.14)',
  blur: 'blur(22px)',
  blurHeavy: 'blur(34px)',
  shadow: '0 8px 40px rgba(60,50,35,0.10), 0 1px 3px rgba(0,0,0,0.03)',
  shadowSm: '0 2px 12px rgba(60,50,35,0.07)',
}

export const font = {
  family:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  display:
    '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif',
  xs: '12px',
  sm: '13px',
  base: '15px',
  md: '17px',
  lg: '22px',
  xl: '30px',
}

export const space = {
  xs: '6px',
  sm: '10px',
  md: '16px',
  lg: '24px',
  xl: '32px',
}

export const radius = {
  sm: '8px',
  md: '12px',
  lg: '18px',
  xl: '24px',
  full: '9999px',
}
