import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://imcyldbaqsvaiuwlishx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltY3lsZGJhcXN2YWl1d2xpc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NDA4MzYsImV4cCI6MjA4NzExNjgzNn0.uBjnlSl4R3o73mCEU-pmEAH3deAkjjDG93YCy19i2UQ'
)
