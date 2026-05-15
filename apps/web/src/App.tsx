import React from 'react'
import { useAuth } from './hooks/useAuth'
import { Login } from './pages/Login'
import { Chat } from './pages/Chat'

export default function App() {
  const { session, loading, signInWithEmail, signOut } = useAuth()

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#444',
          fontSize: '13px',
        }}
      />
    )
  }

  if (!session) {
    return <Login onSignIn={signInWithEmail} />
  }

  return <Chat onSignOut={signOut} />
}
