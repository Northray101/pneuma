import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { Session } from '@supabase/supabase-js'
import Login from './pages/Login'
import Chat from './pages/Chat'
import SkyBackground from './components/SkyBackground'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          position: 'relative',
        }}
      >
        <SkyBackground />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            gap: '6px',
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'rgba(217,120,64,0.7)',
                animation: `loadDot 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
        <style>{`
          @keyframes loadDot {
            0%, 80%, 100% { opacity: 0.2; transform: scale(0.75); }
            40% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    )
  }

  return session ? <Chat session={session} /> : <Login />
}
