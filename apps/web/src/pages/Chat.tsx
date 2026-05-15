import React, { useEffect, useRef, useState } from 'react'
import { MessageBubble, CommandBar, theme } from '@pneuma/ui'
import { useChat } from '../hooks/useChat'
import { supabase } from '../main'

const API_URL = import.meta.env['VITE_PNEUMA_API_URL'] as string

function getOrCreateDeviceId(): string {
  const key = 'pneuma-device-id'
  const stored = localStorage.getItem(key)
  if (stored) return stored
  const id = crypto.randomUUID()
  localStorage.setItem(key, id)
  return id
}

async function ensureDeviceRegistered(deviceId: string, token: string) {
  const registered = localStorage.getItem('pneuma-device-registered')
  if (registered === deviceId) return

  await fetch(`${API_URL}/devices/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'Web Browser',
      platform: 'cli',
      fingerprint: deviceId,
    }),
  })

  localStorage.setItem('pneuma-device-registered', deviceId)
}

interface Props {
  onSignOut: () => void
}

export function Chat({ onSignOut }: Props) {
  const [deviceId] = useState(getOrCreateDeviceId)
  const [ready, setReady] = useState(false)
  const { messages, streaming, send } = useChat(deviceId)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Register device on mount
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token
      if (token) {
        await ensureDeviceRegistered(deviceId, token)
      }
      setReady(true)
    })
  }, [deviceId])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative' }}>
      {/* Background orbs */}
      <div style={orb('#4f8ef7', '50%', '-20%', '-15%')} />
      <div style={orb('#6366f1', '40%', 'auto', 'auto', '-15%', '-15%')} />

      {/* Header */}
      <div
        style={{
          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
          background: theme.glass.surface,
          backdropFilter: theme.glass.blurHeavy,
          WebkitBackdropFilter: theme.glass.blurHeavy,
          borderBottom: `1px solid ${theme.glass.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <span style={{ fontWeight: 500, fontSize: theme.font.size.base, letterSpacing: '-0.2px' }}>
          Pneuma
        </span>
        <button
          onClick={onSignOut}
          style={{
            background: 'none',
            border: `1px solid ${theme.glass.border}`,
            borderRadius: theme.radius.sm,
            color: theme.colors.textMuted,
            fontSize: theme.font.size.sm,
            padding: '4px 10px',
            cursor: 'pointer',
            fontFamily: theme.font.sans,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = theme.glass.borderStrong
            e.currentTarget.style.color = theme.colors.text
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = theme.glass.border
            e.currentTarget.style.color = theme.colors.textMuted
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
          padding: `${theme.spacing.md} ${theme.spacing.sm}`,
          zIndex: 1,
        }}
      >
        {ready && messages.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              color: theme.colors.textMuted,
              marginTop: '25vh',
              fontSize: theme.font.size.sm,
            }}
          >
            What do you need?
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
        ))}

        {streaming && messages[messages.length - 1]?.content === '' && (
          <div
            style={{
              display: 'flex',
              gap: '5px',
              padding: `0 ${theme.spacing.sm}`,
              marginBottom: theme.spacing.sm,
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: theme.colors.textMuted,
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
      `}</style>

      <div style={{ zIndex: 10 }}>
        <CommandBar onSubmit={send} disabled={!ready || streaming} />
      </div>
    </div>
  )
}

function orb(
  color: string,
  size: string,
  top: string,
  left: string,
  bottom = 'auto',
  right = 'auto',
): React.CSSProperties {
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
