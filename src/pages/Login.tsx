import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../App'
import SkyBackground from '../components/SkyBackground'
import { glass, accent, colors, font, space, radius } from '../theme'

export default function Login() {
  const [email, setEmail]   = useState('')
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  async function handleSubmit(e: FormEvent) {
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: font.family,
        position: 'relative',
      }}
    >
      <SkyBackground />

      {/* Card */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '380px',
          margin: space.lg,
          background: glass.surfaceStrong,
          backdropFilter: glass.blurHeavy,
          WebkitBackdropFilter: glass.blurHeavy,
          border: `1px solid ${glass.border}`,
          borderRadius: radius.xl,
          padding: space.xl,
          boxShadow: glass.shadow,
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: space.xs,
            marginBottom: space.lg,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: accent.orange,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: colors.text,
              letterSpacing: '-0.4px',
            }}
          >
            Pneuma
          </span>
        </div>

        <p
          style={{
            color: colors.muted,
            fontSize: font.sm,
            marginBottom: space.lg,
            lineHeight: 1.55,
          }}
        >
          Your personal assistant. Enter your email to sign in.
        </p>

        {sent ? (
          <div
            style={{
              background: 'rgba(217,120,64,0.10)',
              border: `1px solid ${accent.orangeBorder}`,
              borderRadius: radius.md,
              padding: space.md,
              color: colors.mid,
              fontSize: font.sm,
              lineHeight: 1.6,
            }}
          >
            Check <strong style={{ color: colors.text }}>{email}</strong> — your
            sign-in link is on its way.
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
                background: 'rgba(255,255,255,0.60)',
                border: `1.5px solid rgba(180,210,230,0.60)`,
                borderRadius: radius.md,
                color: colors.text,
                fontFamily: font.family,
                fontSize: font.base,
                padding: `11px ${space.md}`,
                outline: 'none',
                width: '100%',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = accent.orange
                e.currentTarget.style.boxShadow = `0 0 0 3px ${accent.orangeMid}`
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(180,210,230,0.60)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />

            {error && (
              <p style={{ color: '#DC2626', fontSize: font.sm, margin: 0 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              style={{
                background: loading ? 'rgba(217,120,64,0.55)' : accent.orange,
                border: 'none',
                borderRadius: radius.md,
                color: '#fff',
                fontFamily: font.family,
                fontSize: font.base,
                fontWeight: 500,
                padding: `11px ${space.md}`,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
                width: '100%',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = accent.orangeHover
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = accent.orange
              }}
            >
              {loading ? 'Sending…' : 'Continue with email'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
