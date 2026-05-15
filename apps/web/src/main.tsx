import React from 'react'
import { createRoot } from 'react-dom/client'
import { createClient } from '@supabase/supabase-js'
import App from './App'

const SUPABASE_URL = import.meta.env['VITE_SUPABASE_URL'] as string
const SUPABASE_ANON_KEY = import.meta.env['VITE_SUPABASE_ANON_KEY'] as string

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

createRoot(document.getElementById('root')!).render(<App />)
