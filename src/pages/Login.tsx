import { useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../App'
import { glass, colors, font, space, radius } from '../theme'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + '/pneuma/' },
    })
    setLoading(false)
    if (err) setError(err.message)
    else setSent(true)
  }

  return (
    <div
      style={{
        height: '100vh',
        background: '#0a0a0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: font.family,
      }}
    >
      <div style={orb('#4f8ef7', '50%', '-15%', '-10%')} />
      <div style={orb('#6366f1', '40%', 'auto', 'auto', '-10%', '-10%')} />

      <div
        style={{
          width: '100%',
          maxWidth: '360px',
          margin: space.md,
          background: glass.surface,
          backdropFilter: glass.blurHeavy,
          WebkitBackdropFilter: glass.blurHeavy,
          border: `1px solid ${glass.borderStrong}`,
          borderRadius: radius.xl,
          padding: space.lg,
          boxShadow: '0 8px 48px rgba(0,0,0,0.4)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 500,
            color: colors.text,
            margin: `0 0 ${space.xs}`,
            letterSpacing: '-0.3px',
          }}
        >
          Pneuma
        </h1>
        <p style={{ color: colors.muted, fontSize: font.sm, margin: `0 0 ${space.lg}` }}>
          Enter your email to get a sign-in link.
        </p>

        {sent ? (
          <div
            style={{
              background: 'rgba(79,142,247,0.1)',
              border: `1px solid ${glass.userBorder}`,
              borderRadius: radius.md,
              padding: space.md,
              color: colors.text,
              fontSize: font.sm,
              lineHeight: 1.5,
            }}
          >
            Check <strong>{email}</strong> — a sign-in link is on its way.
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: space.sm }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
              required
              style={{
                background: glass.inputBg,
                border: `1px solid ${glass.inputBorder}`,
                borderRadius: radius.md,
                color: colors.text,
                fontFamily: font.family,
                fontSize: font.base,
                padding: `10px ${space.md}`,
                outline: 'none',
                width: '100%',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = glass.borderStrong)}
              onBlur={(e) => (e.currentTarget.style.borderColor = glass.inputBorder)}
            />

            {error && (
              <p style={{ color: '#f87171', fontSize: font.sm, margin: 0 }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              style={{
                background: loading ? glass.surface : glass.userBubble,
                border: `1px solid ${glass.userBorder}`,
                backdropFilter: glass.blurLight,
                WebkitBackdropFilter: glass.blurLight,
                borderRadius: radius.md,
                color: loading ? colors.muted : colors.text,
                fontFamily: font.family,
                fontSize: font.base,
                padding: `10px ${space.md}`,
                cursor: loading ? 'not-allowed' : 'pointer',
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
): CSSProperties {
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
