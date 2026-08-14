import { supabase } from './supabaseClient'
import type { Profile } from '@/types'

// Administración > Personal por zona (migración 0019): asigna una Zona fija
// a un USUARIO del sistema (cvalencia, jvillena, etc. — no a un trabajador
// buscado por legajo). Si el usuario logueado tiene zona_asignada, todo lo
// que registre en Atenciones/360 Laboral se guarda con esa zona, sin
// importar el fundo/zona del trabajador involucrado ese día (ver uso en
// AtencionForm/RegistrarCaminata).
export async function listarUsuarios(): Promise<Profile[]> {
  const { data } = await supabase.from('profiles').select('*').order('nombre_completo')
  return (data as Profile[]) ?? []
}

export async function asignarZonaUsuario(id: string, zona: string | null): Promise<{ error: string | null }> {
  const { error } = await supabase.from('profiles').update({ zona_asignada: zona }).eq('id', id)
  return { error: error?.message ?? null }
}
