import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uokqhrbiwqcyuszltsxk.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVva3FocmJpd3FjeXVzemx0c3hrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM0NjIxMSwiZXhwIjoyMDg5OTIyMjExfQ.Cj5VrIod1UO0xXkDFpN2UFi-mk6pgDbse4OcFfmySFk';

// Service role client — bypasses RLS for full admin access
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
