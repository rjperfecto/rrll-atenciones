import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && anonKey)

// Cuando aún no se configuró Supabase (.env), exportamos un cliente apuntando
// a una URL dummy para que el resto de la app pueda importar sin romperse;
// las llamadas fallarán y quedarán encoladas en el outbox local hasta que
// se configuren las credenciales reales.
export const supabase = createClient(
  url ?? 'https://placeholder.supabase.co',
  anonKey ?? 'placeholder-anon-key',
)
