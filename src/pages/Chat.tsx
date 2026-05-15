import { useState, useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../App'
import { useChat } from '../hooks/useChat'
import SkyBackground from '../components/SkyBackground'
import { glass, accent, colors, font, space, radius } from '../theme'
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

export default function Chat({ session }: { session: Session }) {
  const [deviceId]        = useState(getOrCreateDeviceId)
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
        fontFamily: font.family,
        position: 'relative',
      }}
    >
      <SkyBackground />

      {/* ── Header ── */}
      <header
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${space.sm} ${space.md}`,
          background: glass.surfaceStrong,
          backdropFilter: glass.blurHeavy,
          WebkitBackdropFilter: glass.blurHeavy,
          borderBottom: `1px solid ${glass.border}`,
          boxShadow: glass.shadowSm,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: space.xs }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: accent.orange,
            }}
          />
          <span
            style={{
              fontWeight: 600,
              fontSize: font.md,
              color: colors.text,
              letterSpacing: '-0.3px',
            }}
          >
            Pneuma
          </span>
        </div>

        <button
          onClick={() => supabase.auth.signOut()}
          style={{
            background: 'none',
            border: `1px solid rgba(180,210,230,0.55)`,
            borderRadius: radius.full,
            color: colors.muted,
            fontSize: font.xs,
            padding: `4px 12px`,
            cursor: 'pointer',
            fontFamily: font.family,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = accent.orange
            e.currentTarget.style.color = accent.orange
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(180,210,230,0.55)'
            e.currentTarget.style.color = colors.muted
          }}
        >
          Sign out
        </button>
      </header>

      {/* ── Messages ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: `${space.lg} ${space.md}`,
          display: 'flex',
          flexDirection: 'column',
          gap: space.sm,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {ready && messages.length === 0 && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              paddingBottom: '10vh',
              gap: space.md,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                background: glass.surface,
                backdropFilter: glass.blur,
                WebkitBackdropFilter: glass.blur,
                border: `1px solid ${glass.border}`,
                borderRadius: radius.xl,
                padding: `${space.lg} ${space.xl}`,
                boxShadow: glass.shadow,
                maxWidth: 360,
              }}
            >
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: colors.text,
                  letterSpacing: '-0.6px',
                  marginBottom: space.xs,
                }}
              >
                What can I help with?
              </div>
              <div style={{ color: colors.muted, fontSize: font.sm, lineHeight: 1.6 }}>
                Ask me anything — I remember context across your conversation.
              </div>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            {msg.role === 'error' ? (
              <div
                style={{
                  maxWidth: '80%',
                  background: 'rgba(220,38,38,0.08)',
                  border: '1px solid rgba(220,38,38,0.20)',
                  borderRadius: radius.lg,
                  color: '#DC2626',
                  padding: `9px ${space.md}`,
                  fontSize: font.sm,
                  lineHeight: 1.55,
                }}
              >
                {msg.content}
              </div>
            ) : (
              <div
                style={{
                  maxWidth: '78%',
                  background:
                    msg.role === 'user'
                      ? accent.orangeMid
                      : glass.surface,
                  backdropFilter: glass.blur,
                  WebkitBackdropFilter: glass.blur,
                  border: `1px solid ${
                    msg.role === 'user' ? accent.orangeBorder : glass.border
                  }`,
                  borderRadius:
                    msg.role === 'user'
                      ? `${radius.lg} ${radius.lg} ${radius.sm} ${radius.lg}`
                      : `${radius.lg} ${radius.lg} ${radius.lg} ${radius.sm}`,
                  color: colors.text,
                  padding: `10px ${space.md}`,
                  fontSize: font.base,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  boxShadow: glass.shadowSm,
                }}
              >
                {msg.content}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {streaming && messages[messages.length - 1]?.content === '' && (
          <div style={{ display: 'flex', gap: '5px', paddingLeft: space.xs }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: accent.orange,
                  opacity: 0.6,
                  animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        )}

        <style>{`
          @keyframes typingDot {
            0%, 80%, 100% { opacity: 0.25; transform: scale(0.75); }
            40% { opacity: 0.9; transform: scale(1); }
          }
          textarea::placeholder { color: #9CA3AF; }
          ::-webkit-scrollbar { width: 5px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(0,100,160,0.18); border-radius: 9999px; }
        `}</style>

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          padding: `${space.sm} ${space.md} ${space.md}`,
          background: glass.surfaceStrong,
          backdropFilter: glass.blurHeavy,
          WebkitBackdropFilter: glass.blurHeavy,
          borderTop: `1px solid ${glass.border}`,
          boxShadow: '0 -4px 20px rgba(0,90,160,0.06)',
          flexShrink: 0,
        }}
      >
        <InputBar onSubmit={send} disabled={!ready || streaming} />
      </div>
    </div>
  )
}

function InputBar({
  onSubmit,
  disabled,
}: {
  onSubmit: (msg: string) => void
  disabled: boolean
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
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <textarea
        ref={ref}
        rows={1}
        disabled={disabled}
        placeholder={disabled ? 'Connecting…' : 'Message Pneuma…'}
        onKeyDown={handleKey}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          resize: 'none',
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1.5px solid ${focused ? accent.orange : 'rgba(180,210,230,0.55)'}`,
          borderRadius: radius.lg,
          color: colors.text,
          fontFamily: font.family,
          fontSize: font.base,
          padding: `11px ${space.md}`,
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: focused ? `0 0 0 3px ${accent.orangeMid}` : 'none',
          lineHeight: 1.5,
        }}
      />
      <div
        style={{
          fontSize: font.xs,
          color: colors.faint,
          paddingLeft: '2px',
          lineHeight: 1,
        }}
      >
        Enter to send · Shift+Enter for new line
      </div>
    </div>
  )
}

