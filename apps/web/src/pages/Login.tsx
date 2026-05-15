import React, { useState } from 'react'
import { theme } from '@pneuma/ui'

interface Props {
  onSignIn: (email: string) => Promise<{ error: Error | null }>
}

export function Login({ onSignIn }: Props) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error } = await onSignIn(email.trim())
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background orbs */}
      <div style={orb('#4f8ef7', '40%', '-15%', '-10%')} />
      <div style={orb('#6366f1', '35%', 'auto', '-10%', 'auto', '-10%')} />

      {/* Glass card */}
      <div
        style={{
          width: '100%',
          maxWidth: '360px',
          margin: theme.spacing.md,
          background: theme.glass.surface,
          backdropFilter: theme.glass.blurHeavy,
          WebkitBackdropFilter: theme.glass.blurHeavy,
          border: `1px solid ${theme.glass.borderStrong}`,
          borderRadius: theme.radius.xl,
          padding: theme.spacing.lg,
          boxShadow: '0 8px 48px rgba(0,0,0,0.4)',
        }}
      >
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 500,
            color: theme.colors.text,
            marginBottom: '6px',
            letterSpacing: '-0.3px',
          }}
        >
          Pneuma
        </h1>
        <p style={{ color: theme.colors.textMuted, fontSize: theme.font.size.sm, marginBottom: theme.spacing.lg }}>
          Enter your email to get a sign-in link.
        </p>

        {sent ? (
          <div
            style={{
              background: 'rgba(79, 142, 247, 0.1)',
              border: `1px solid ${theme.glass.userBorder}`,
              borderRadius: theme.radius.md,
              padding: theme.spacing.md,
              color: theme.colors.text,
              fontSize: theme.font.size.sm,
              lineHeight: 1.5,
            }}
          >
            Check <strong>{email}</strong> — a sign-in link is on its way.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
              required
              style={{
                background: theme.glass.inputBg,
                border: `1px solid ${theme.glass.inputBorder}`,
                borderRadius: theme.radius.md,
                color: theme.colors.text,
                fontFamily: theme.font.sans,
                fontSize: theme.font.size.base,
                padding: `10px ${theme.spacing.md}`,
                outline: 'none',
                width: '100%',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = theme.glass.borderStrong)}
              onBlur={(e) => (e.currentTarget.style.borderColor = theme.glass.inputBorder)}
            />

            {error && (
              <p style={{ color: '#f87171', fontSize: theme.font.size.sm }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              style={{
                background: loading ? theme.glass.surface : theme.glass.userBubble,
                border: `1px solid ${theme.glass.userBorder}`,
                backdropFilter: theme.glass.blurLight,
                WebkitBackdropFilter: theme.glass.blurLight,
                borderRadius: theme.radius.md,
                color: loading ? theme.colors.textMuted : theme.colors.text,
                fontFamily: theme.font.sans,
                fontSize: theme.font.size.base,
                padding: `10px ${theme.spacing.md}`,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                width: '100%',
              }}
            >
              {loading ? 'Sending…' : 'Send link'}
            </button>
          </form>
        )}
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
    background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
    borderRadius: '50%',
    top,
    left,
    bottom,
    right,
    pointerEvents: 'none',
    filter: 'blur(40px)',
    zIndex: 0,
  }
}
