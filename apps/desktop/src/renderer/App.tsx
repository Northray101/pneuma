import React, { useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { MessageBubble, CommandBar, theme } from '@pneuma/ui'
import { useChat } from './hooks/useChat'

const SUPABASE_URL = import.meta.env['VITE_SUPABASE_URL'] as string
const SUPABASE_ANON_KEY = import.meta.env['VITE_SUPABASE_ANON_KEY'] as string
const API_URL = import.meta.env['VITE_PNEUMA_API_URL'] as string
const DEVICE_ID = import.meta.env['VITE_DEVICE_ID'] as string

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? ''
}

export default function App() {
  const { messages, streaming, send } = useChat({
    apiUrl: API_URL,
    getToken,
    deviceId: DEVICE_ID,
  })

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: theme.colors.bg,
        color: theme.colors.text,
        fontFamily: theme.font.sans,
      }}
    >
      {/* Drag region for frameless window */}
      <div
        style={{
          height: '28px',
          WebkitAppRegion: 'drag',
          flexShrink: 0,
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: theme.spacing.md,
          fontSize: '12px',
          color: theme.colors.textMuted,
        } as React.CSSProperties}
      >
        Pneuma
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: theme.spacing.md,
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              color: theme.colors.textMuted,
              textAlign: 'center',
              marginTop: '20%',
              fontSize: theme.font.size.sm,
            }}
          >
            What do you need?
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <CommandBar onSubmit={send} disabled={streaming} />
    </div>
  )
}
