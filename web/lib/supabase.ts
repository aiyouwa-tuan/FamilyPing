import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uokqhrbiwqcyuszltsxk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVva3FocmJpd3FjeXVzemx0c3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNDYyMTEsImV4cCI6MjA4OTkyMjIxMX0.NYYVZC2RKAVJvdAx44Y9AfS3TVqB15h3rn0a2YReHQ4'

let client: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  if (typeof window === 'undefined') {
    // Server-side: create a new client each time (no persistence)
    return createSupabaseClient(supabaseUrl, supabaseAnonKey)
  }
  if (client) return client
  client = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'implicit',
      detectSessionInUrl: true,
      persistSession: true,
    },
  })
  return client
}
