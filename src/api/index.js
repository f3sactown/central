import { createLocalApi } from './local.js'
import { normalizeSupabaseUrl } from './shared.js'
import { createSupabaseApi } from './supabase.js'

const url = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL)
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

// With Supabase settings the app uses the real backend; without them it
// falls back to the in-browser demo so the site still works.
export const api = url && key ? createSupabaseApi(url, key) : createLocalApi()
