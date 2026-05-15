import { useEffect, useRef, useState } from 'react'
import { colors, font } from '../theme'

interface LiveTextProps {
  userText?: string
  userId?: string
  assistantText?: string
  assistantIsError?: boolean
  streaming: boolean
}

// Splits into words; only words past the previously-shown count animate in,
// so streaming re-renders don't re-animate already-visible words.
function Words({
  text,
  base,
  color,
  size,
  display,
}: {
  text: string
  base: string
  color: string
  size: string
  display: boolean
}) {
  const shown = useRef<{ base: string; count: number }>({ base: '', count: 0 })
  const words = text.split(/(\s+)/).filter((w) => w.length > 0)

  const start = shown.current.base === base ? shown.current.count : 0
  shown.current = { base, count: words.length }

  return (
    <div
      style={{
        fontFamily: display ? font.display : font.family,
        fontSize: size,
        lineHeight: 1.7,
        color,
        letterSpacing: display ? '-0.01em' : undefined,
        maxWidth: '34rem',
        textAlign: 'center',
      }}
    >
      {words.map((w, i) => {
        if (/^\s+$/.test(w)) return <span key={i}>{w}</span>
        const fresh = i >= start
        const delay = Math.min((i - start) * 28, 600)
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              animation: fresh
                ? `wordIn 520ms cubic-bezier(.22,.61,.36,1) ${delay}ms both`
                : undefined,
            }}
          >
            {w}
          </span>
        )
      })}
    </div>
  )
}

export default function LiveText({
  userText,
  userId,
  assistantText,
  assistantIsError,
  streaming,
}: LiveTextProps) {
  const key = userId ?? 'none'
  const [exiting, setExiting] = useState<
    { key: string; user?: string; assistant?: string; isError?: boolean } | null
  >(null)
  const prev = useRef<{
    key: string
    user?: string
    assistant?: string
    isError?: boolean
  }>({ key })

  useEffect(() => {
    if (prev.current.key !== key && prev.current.key !== 'none') {
      const old = prev.current
      setExiting(old)
      const t = setTimeout(() => setExiting(null), 480)
      prev.current = { key, user: userText, assistant: assistantText, isError: assistantIsError }
      return () => clearTimeout(t)
    }
    prev.current = { key, user: userText, assistant: assistantText, isError: assistantIsError }
  }, [key, userText, assistantText, assistantIsError])

  const showAssistant = !!assistantText || (streaming && !!userText)

  return (
    <>
      <style>{`
        @keyframes wordIn {
          from { opacity: 0; transform: translateY(8px); filter: blur(6px); }
          to   { opacity: 1; transform: translateY(0);   filter: blur(0); }
        }
        @keyframes blockOut {
          to { opacity: 0; transform: translateY(-10px); filter: blur(8px); }
        }
        @keyframes caretBlink { 0%,100%{opacity:0.15} 50%{opacity:0.55} }
        .lt-stack {
          display: flex; flex-direction: column; align-items: center;
          gap: 20px; pointer-events: none;
        }
        .lt-exit {
          position: absolute; left: 0; right: 0;
          display: flex; flex-direction: column; align-items: center; gap: 20px;
          animation: blockOut 460ms cubic-bezier(.4,0,.6,1) forwards;
        }
      `}</style>

      <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
        {exiting && (
          <div className="lt-exit">
            {exiting.user && (
              <div style={{ fontFamily: font.family, fontSize: font.sm, color: colors.faint }}>
                {exiting.user}
              </div>
            )}
            {exiting.assistant && (
              <div
                style={{
                  fontFamily: font.display,
                  fontSize: font.lg,
                  color: exiting.isError ? colors.error : colors.text,
                  maxWidth: '34rem',
                  textAlign: 'center',
                  lineHeight: 1.7,
                }}
              >
                {exiting.assistant}
              </div>
            )}
          </div>
        )}

        <div className="lt-stack" style={{ opacity: exiting ? 0 : 1 }}>
          {userText && (
            <Words
              text={userText}
              base={`u-${key}`}
              color={colors.faint}
              size={font.sm}
              display={false}
            />
          )}

          {showAssistant && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
              <Words
                text={assistantText ?? ''}
                base={`a-${key}`}
                color={assistantIsError ? colors.error : colors.text}
                size={font.lg}
                display
              />
              {streaming && !assistantIsError && (
                <span
                  style={{
                    display: 'inline-block',
                    width: '2px',
                    height: '1.1em',
                    marginBottom: '0.25em',
                    background: colors.muted,
                    animation: 'caretBlink 1.4s ease-in-out infinite',
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
