import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.warn(
    '[VAGA OPS] Supabase env vars missing. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local. ' +
    'App will run in offline mode (localStorage only).'
  )
}

export const supabase = url && key ? createClient(url, key) : null
