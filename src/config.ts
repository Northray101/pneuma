// Public client configuration.
//
// These values are safe to commit: the Supabase anon key is designed to be
// exposed in client-side code — Row Level Security protects the data, not the
// key. This is NOT the secret/service key (sb_secret_...), which must never
// appear here.

export const SUPABASE_URL = 'https://frwozbjygsxiapaselen.supabase.co'

export const PNEUMA_API_URL =
  'https://frwozbjygsxiapaselen.supabase.co/functions/v1'

// Supabase "anon public" key — Dashboard → Project Settings → API.
// Legacy JWT format starts with "eyJ...", new format starts with
// "sb_publishable_...". Paste the real value below.
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyd296Ymp5Z3N4aWFwYXNlbGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTE4MTEsImV4cCI6MjA5NDM4NzgxMX0.p81mZ9B9Qx2lbJN1gBhLQTawBWkhrn3CbOSPXLVcvck'
