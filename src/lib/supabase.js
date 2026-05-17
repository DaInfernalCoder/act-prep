import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://ylgxnutrbejubgiqcsew.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsZ3hudXRyYmVqdWJnaXFjc2V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NzIwMzEsImV4cCI6MjA5NDU0ODAzMX0.hrfHf8MxEBYsdA90BSF8QzUJrcPdFFCT-JVJusz5jY4'
)
