import { supabase } from './supabaseClient'
import type { Profile, Rol } from '@/types'

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

// SUPERVISOR ve/administra/elimina todas las atenciones y caminatas 360 de
// su zona_asignada (no solo las propias); ADMIN sigue viendo todo sin
// restricción de zona; CAMPO solo lo propio (ver migración 0020).
export async function asignarRolUsuario(id: string, rol: Rol): Promise<{ error: string | null }> {
  const { error } = await supabase.from('profiles').update({ rol }).eq('id', id)
  return { error: error?.message ?? null }
}

export interface NuevoUsuario {
  usuario: string
  password: string
  nombreCompleto: string
  rol: Rol
  zonaAsignada: string | null
}

// Crea la cuenta (auth.users + profiles) vía la Edge Function crear-usuario:
// crear cuentas requiere la service_role key, que nunca puede vivir en el
// navegador, así que corre en el servidor de Supabase, no acá.
export async function crearUsuario(datos: NuevoUsuario): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke<{ id: string; email: string }>('crear-usuario', {
    body: datos,
  })
  if (error) {
    // El body del error (mensaje real del servidor) viene en error.context;
    // sin esto solo se ve "Edge Function returned a non-2xx status code".
    const detalle = await error.context?.json?.().catch(() => null)
    return { id: null, error: detalle?.error ?? error.message }
  }
  return { id: data?.id ?? null, error: null }
}
