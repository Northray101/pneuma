import { useState, useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../App'
import { useChat } from '../hooks/useChat'
import { useVoiceInput } from '../hooks/useVoiceInput'
import { useTTS } from '../hooks/useTTS'
import HueField from '../components/HueField'
import Orb from '../components/Orb'
import type { OrbState } from '../components/Orb'
import LiveText from '../components/LiveText'
import type { EmotionVisual } from '../lib/emotion'
import { colors, font, space, radius, glass } from '../theme'
import { PNEUMA_API_URL as API_URL } from '../config'

function getOrCreateDeviceId(): string {
  const stored = localStorage.getItem('pneuma-device-id')
  if (stored) return stored
  const id = crypto.randomUUID()
  localStorage.setItem('pneuma-device-id', id)
  return id
}

async function ensureDeviceRegistered(deviceId: string, token: string) {
  if (localStorage.getItem('pneuma-device-reg-v2') === deviceId) return
  try {
    const res = await fetch(`${API_URL}/devices/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'Web Browser', platform: 'cli', fingerprint: deviceId }),
    })
    if (res.ok) {
      localStorage.setItem('pneuma-device-reg-v2', deviceId)
    } else {
      console.error('[device] registration failed:', res.status, await res.text().catch(() => ''))
    }
  } catch (e) {
    console.error('[device] registration error:', e)
  }
}

// Tweens --mh/--ms/--ml (unitless) on `el` toward the target emotion,
// shortest-path on hue, ~1s ease-in-out. Drives HueField + Orb with no
// React re-render.
function useHueTween(target: EmotionVisual, el: HTMLElement | null) {
  const cur = useRef({ h: target.hue, s: target.sat, l: target.light })
  const raf = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!el) return
    const from = { ...cur.current }
    let dh = target.hue - from.h
    if (dh > 180) dh -= 360
    if (dh < -180) dh += 360
    const t0 = performance.now()
    const dur = 1000
    const ease = (x: number) =>
      x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2

    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur)
      const e = ease(p)
      const h = (((from.h + dh * e) % 360) + 360) % 360
      const s = from.s + (target.sat - from.s) * e
      const l = from.l + (target.light - from.l) * e
      cur.current = { h, s, l }
      el.style.setProperty('--mh', h.toFixed(2))
      el.style.setProperty('--ms', s.toFixed(2))
      el.style.setProperty('--ml', l.toFixed(2))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [target.hue, target.sat, target.light, el])
}

export default function Chat({ session }: { session: Session }) {
  const [deviceId] = useState(getOrCreateDeviceId)
  const [ready, setReady] = useState(false)
  const tts = useTTS(session.access_token)
  const { streaming, send, emotion, latestUser, latestAssistant } = useChat(
    deviceId,
    session,
  )
  const voice = useVoiceInput({ onFinal: send, disabled: streaming })

  const rootRef = useRef<HTMLDivElement>(null)
  const [rootEl, setRootEl] = useState<HTMLDivElement | null>(null)
  useEffect(() => setRootEl(rootRef.current), [])
  useHueTween(emotion, rootEl)

  useEffect(() => {
    ensureDeviceRegistered(deviceId, session.access_token).then(() => setReady(true))
  }, [deviceId, session.access_token])

  // Auto-speak assistant response when streaming finishes
  const prevStreamingRef = useRef(false)
  useEffect(() => {
    if (prevStreamingRef.current && !streaming) {
      const text = latestAssistant?.role === 'assistant' ? latestAssistant.content : ''
      if (text) tts.speak(text)
    }
    prevStreamingRef.current = streaming
  }, [streaming]) // eslint-disable-line react-hooks/exhaustive-deps

  const assistantIsError = latestAssistant?.role === 'error'
  const assistantText = latestAssistant && latestAssistant.role !== 'user'
    ? latestAssistant.content
    : ''

  let orbState: OrbState = 'idle'
  if (streaming && assistantText === '' && !assistantIsError) orbState = 'thinking'
  else if (streaming && assistantText !== '') orbState = 'speaking'
  else if (tts.speaking) orbState = 'speaking'
  else if (voice.listening) orbState = 'listening'

  const hasConversation = !!latestUser

  return (
    <div
      ref={rootRef}
      style={{
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: font.family,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <HueField />

      {/* Orb + live text — vertically centered */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: space.xl,
          padding: space.lg,
        }}
      >
        <Orb state={orbState} />

        <div style={{ zIndex: 2, minHeight: '4rem', width: '100%' }}>
          {hasConversation ? (
            <LiveText
              userText={latestUser?.content}
              userId={latestUser?.id}
              assistantText={assistantText || undefined}
              assistantIsError={assistantIsError}
              streaming={streaming}
            />
          ) : (
            <div
              style={{
                textAlign: 'center',
                color: colors.faint,
                fontSize: font.sm,
                fontFamily: font.family,
                opacity: ready ? 1 : 0,
                transition: 'opacity 600ms ease',
              }}
            >
              {voice.listening ? 'Listening…' : 'Speak or type.'}
            </div>
          )}
          {voice.interim && (
            <div
              style={{
                textAlign: 'center',
                marginTop: space.sm,
                color: colors.faint,
                fontStyle: 'italic',
                fontSize: font.sm,
              }}
            >
              {voice.interim}
            </div>
          )}
          {voice.error && (
            <div
              style={{
                textAlign: 'center',
                marginTop: space.sm,
                color: colors.error,
                fontSize: font.xs,
              }}
            >
              {voice.error}
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          width: '100%',
          maxWidth: 620,
          padding: `0 ${space.md} ${space.xl}`,
        }}
      >
        <InputBar
          onSubmit={(msg) => { tts.stop(); send(msg) }}
          disabled={!ready || streaming}
          voice={voice}
        />
      </div>

      {/* Sign out — quiet, appears on hover */}
      <button
        onClick={() => supabase.auth.signOut()}
        style={{
          position: 'absolute',
          top: space.md,
          right: space.md,
          zIndex: 3,
          background: 'none',
          border: 'none',
          color: colors.faint,
          fontSize: font.xs,
          fontFamily: font.family,
          cursor: 'pointer',
          opacity: 0.35,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.35')}
      >
        Sign out
      </button>
    </div>
  )
}

function InputBar({
  onSubmit,
  disabled,
  voice,
}: {
  onSubmit: (msg: string) => void
  disabled: boolean
  voice: ReturnType<typeof useVoiceInput>
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [focused, setFocused] = useState(false)

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const value = ref.current?.value.trim()
      if (!value || disabled) return
      onSubmit(value)
      if (ref.current) ref.current.value = ''
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: space.sm,
        background: glass.surfaceStrong,
        backdropFilter: glass.blurHeavy,
        WebkitBackdropFilter: glass.blurHeavy,
        border: `1px solid ${glass.border}`,
        borderRadius: radius.full,
        boxShadow: focused ? glass.shadow : glass.shadowSm,
        padding: `8px 10px 8px ${space.md}`,
        transition: 'box-shadow 0.2s',
      }}
    >
      <textarea
        ref={ref}
        rows={1}
        disabled={disabled}
        placeholder={disabled ? 'One moment…' : 'Message Pneuma…'}
        onKeyDown={handleKey}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1,
          resize: 'none',
          background: 'transparent',
          border: 'none',
          color: colors.text,
          fontFamily: font.family,
          fontSize: font.base,
          outline: 'none',
          lineHeight: 1.5,
          maxHeight: '6em',
        }}
      />
      {voice.supported && (
        <button
          aria-label={voice.listening ? 'Stop listening' : 'Speak'}
          onClick={() => (voice.listening ? voice.stop() : voice.start())}
          disabled={disabled && !voice.listening}
          style={{
            flexShrink: 0,
            width: 38,
            height: 38,
            borderRadius: radius.full,
            border: 'none',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            background: voice.listening
              ? `hsl(var(--mh,32) calc(var(--ms,22) * 1%) 88%)`
              : 'rgba(0,0,0,0.04)',
            color: voice.listening ? colors.text : colors.muted,
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <line x1="12" y1="18" x2="12" y2="22" />
          </svg>
        </button>
      )}
    </div>
  )
}
