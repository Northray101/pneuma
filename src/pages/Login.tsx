import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../App'
import HueField from '../components/HueField'
import { glass, colors, font, space, radius } from '../theme'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      <HueField />

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
        <div
          style={{
            fontFamily: font.display,
            fontSize: '26px',
            fontWeight: 500,
            color: colors.text,
            letterSpacing: '-0.01em',
            marginBottom: space.sm,
          }}
        >
          Pneuma
        </div>

        <p
          style={{
            color: colors.muted,
            fontSize: font.sm,
            marginBottom: space.lg,
            lineHeight: 1.6,
          }}
        >
          A presence that remembers. Enter your email to begin.
        </p>

        {sent ? (
          <div
            style={{
              background: 'rgba(255,255,255,0.5)',
              border: `1px solid ${glass.borderSubtle}`,
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
                background: 'rgba(255,255,255,0.6)',
                border: `1.5px solid ${glass.borderSubtle}`,
                borderRadius: radius.md,
                color: colors.text,
                fontFamily: font.family,
                fontSize: font.base,
                padding: `11px ${space.md}`,
                outline: 'none',
                width: '100%',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.muted
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = glass.borderSubtle
              }}
            />

            {error && (
              <p style={{ color: colors.error, fontSize: font.sm, margin: 0 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              style={{
                background: loading ? colors.muted : colors.text,
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
