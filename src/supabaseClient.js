import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gqtucomapdpsntrsswgb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxdHVjb21hcGRwc250cnNzd2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0ODE3ODAsImV4cCI6MjA4MDA1Nzc4MH0.S_-qCmSXVMeu8A1t45B0eNuFRivZwo30ZfNP161z9cM'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})