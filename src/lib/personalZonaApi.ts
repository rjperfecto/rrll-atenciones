import { supabase } from './supabaseClient'
import type { Zona } from '@/data/zonasFundos'

// Asignación fija de personal a una zona (Administración > Personal por
// zona, migración 0018): un legajo asignado acá SIEMPRE registra en esa
// zona, sin importar en qué fundo/zona aparezca trabajando ese día según
// TAREO. Usado tanto por la pantalla admin como por el autocompletado/envío
// de Atenciones y 360 Laboral (FormularioGeneral, AtencionForm,
// RegistrarCaminata).
export interface PersonalZona {
  legajo: string
  nombre_completo: string
  zona: Zona
  updated_at: string
}

export async function obtenerZonaAsignada(legajo: string): Promise<Zona | null> {
  const { data } = await supabase.from('personal_zona').select('zona').eq('legajo', legajo).maybeSingle()
  return (data as { zona: Zona } | null)?.zona ?? null
}

export async function listarPersonalZona(): Promise<PersonalZona[]> {
  const { data } = await supabase.from('personal_zona').select('*').order('zona').order('nombre_completo')
  return (data as PersonalZona[]) ?? []
}

export async function asignarPersonalZona(
  legajo: string,
  nombreCompleto: string,
  zona: Zona,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('personal_zona')
    .upsert({ legajo, nombre_completo: nombreCompleto, zona, updated_at: new Date().toISOString() })
  return { error: error?.message ?? null }
}

export async function quitarPersonalZona(legajo: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('personal_zona').delete().eq('legajo', legajo)
  return { error: error?.message ?? null }
}
