import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { Session } from '@supabase/supabase-js'
import Login from './pages/Login'
import Chat from './pages/Chat'
import HueField from './components/HueField'
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
          position: 'relative',
        }}
      >
        <HueField />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'hsla(var(--mh,32), calc(var(--ms,22) * 1%), 100%, 0.4)',
            backdropFilter: 'blur(14px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(14px) saturate(1.4)',
            border: '1px solid rgba(255,255,255,0.7)',
            boxShadow: 'inset 0 0 30px rgba(255,255,255,0.5)',
            animation: 'appBreathe 3s ease-in-out infinite',
          }}
        />
        <style>{`
          @keyframes appBreathe {
            0%, 100% { transform: scale(0.94); opacity: 0.7; }
            50%      { transform: scale(1);    opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  return session ? <Chat session={session} /> : <Login />
}
