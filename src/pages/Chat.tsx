import { useState, useEffect, useRef } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../App'
import { useChat } from '../hooks/useChat'
import { glass, colors, font, space, radius } from '../theme'

const API_URL = import.meta.env.VITE_PNEUMA_API_URL

function getOrCreateDeviceId(): string {
  const stored = localStorage.getItem('pneuma-device-id')
  if (stored) return stored
  const id = crypto.randomUUID()
  localStorage.setItem('pneuma-device-id', id)
  return id
}

async function ensureDeviceRegistered(deviceId: string, token: string) {
  if (localStorage.getItem('pneuma-device-registered') === deviceId) return
  await fetch(`${API_URL}/devices/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: 'Web Browser', platform: 'cli', fingerprint: deviceId }),
  }).catch(() => {/* non-fatal */})
  localStorage.setItem('pneuma-device-registered', deviceId)
}

export default function Chat({ session }: { session: Session }) {
  const [deviceId] = useState(getOrCreateDeviceId)
  const [ready, setReady] = useState(false)
  const { messages, streaming, send } = useChat(deviceId, session)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ensureDeviceRegistered(deviceId, session.access_token).then(() => setReady(true))
  }, [deviceId, session.access_token])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#0a0a0f',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: font.family,
      }}
    >
      <div style={orb('#4f8ef7', '50%', '-20%', '-15%')} />
      <div style={orb('#6366f1', '40%', 'auto', 'auto', '-15%', '-15%')} />

      {/* Header */}
      <div
        style={{
          padding: `${space.sm} ${space.md}`,
          background: glass.surface,
          backdropFilter: glass.blurHeavy,
          WebkitBackdropFilter: glass.blurHeavy,
          borderBottom: `1px solid ${glass.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          zIndex: 10,
          position: 'relative',
        }}
      >
        <span
          style={{ fontWeight: 500, fontSize: font.base, letterSpacing: '-0.2px', color: colors.text }}
        >
          Pneuma
        </span>
        <button
          onClick={() => supabase.auth.signOut()}
          style={{
            background: 'none',
            border: `1px solid ${glass.border}`,
            borderRadius: radius.sm,
            color: colors.muted,
            fontSize: font.sm,
            padding: '4px 10px',
            cursor: 'pointer',
            fontFamily: font.family,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = glass.borderStrong
            e.currentTarget.style.color = colors.text
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = glass.border
            e.currentTarget.style.color = colors.muted
          }}
        >
          Sign out
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: `${space.md} ${space.sm}`,
          zIndex: 1,
          position: 'relative',
        }}
      >
        {ready && messages.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              color: colors.muted,
              marginTop: '25vh',
              fontSize: font.sm,
            }}
          >
            What do you need?
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: space.sm,
              padding: `0 ${space.xs}`,
            }}
          >
            <div
              style={{
                maxWidth: '72%',
                background: msg.role === 'user' ? glass.userBubble : glass.surface,
                backdropFilter: glass.blurLight,
                WebkitBackdropFilter: glass.blurLight,
                border: `1px solid ${msg.role === 'user' ? glass.userBorder : glass.border}`,
                borderRadius:
                  msg.role === 'user'
                    ? `${radius.lg} ${radius.lg} ${radius.sm} ${radius.lg}`
                    : `${radius.lg} ${radius.lg} ${radius.lg} ${radius.sm}`,
                color: colors.text,
                padding: `10px ${space.md}`,
                fontSize: font.base,
                lineHeight: '1.55',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {streaming && (
          <div
            style={{
              display: 'flex',
              gap: '5px',
              padding: `0 ${space.sm}`,
              marginBottom: space.sm,
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: colors.muted,
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        textarea::placeholder { color: #444; }
      `}</style>

      {/* Input bar */}
      <div
        style={{
          padding: space.md,
          background: glass.surface,
          backdropFilter: glass.blurHeavy,
          WebkitBackdropFilter: glass.blurHeavy,
          borderTop: `1px solid ${glass.border}`,
          flexShrink: 0,
          zIndex: 10,
          position: 'relative',
        }}
      >
        <InputBar onSubmit={send} disabled={!ready || streaming} />
      </div>
    </div>
  )
}

function InputBar({ onSubmit, disabled }: { onSubmit: (msg: string) => void; disabled: boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null)

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
    <>
      <textarea
        ref={ref}
        rows={1}
        disabled={disabled}
        placeholder="Ask anything…"
        onKeyDown={handleKey}
        style={{
          width: '100%',
          resize: 'none',
          background: glass.inputBg,
          backdropFilter: glass.blurLight,
          WebkitBackdropFilter: glass.blurLight,
          border: `1px solid ${glass.inputBorder}`,
          borderRadius: radius.md,
          color: colors.text,
          fontFamily: font.family,
          fontSize: font.base,
          padding: `10px ${space.md}`,
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = glass.borderStrong)}
        onBlur={(e) => (e.currentTarget.style.borderColor = glass.inputBorder)}
      />
      <div
        style={{ fontSize: '11px', color: colors.muted, marginTop: '6px', opacity: 0.6 }}
      >
        Enter to send · Shift+Enter for newline
      </div>
    </>
  )
}

function orb(
  color: string,
  size: string,
  top: string,
  left: string,
  bottom = 'auto',
  right = 'auto',
): CSSProperties {
  return {
    position: 'fixed',
    width: size,
    height: size,
    background: `radial-gradient(circle, ${color}12 0%, transparent 70%)`,
    borderRadius: '50%',
    top,
    left,
    bottom,
    right,
    pointerEvents: 'none',
    filter: 'blur(60px)',
    zIndex: 0,
  }
}
