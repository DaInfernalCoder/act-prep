import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://pnuihxemmmtdpvakndgg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBudWloeGVtbW10ZHB2YWtuZGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMTYwOTYsImV4cCI6MjA4OTg5MjA5Nn0.rwDVpFvD7GHQy0GUpaF0dwXxdVSlf20zQ0GD24OR7tY'
)
