import { supabase } from './supabaseClient'

// Para el tablero de 360 Laboral > Próximas caminatas (ver migración 0031).

export async function listarGrupoFundoActual(): Promise<Map<string, string | null>> {
  const { data } = await supabase.from('v_grupo_fundo_actual').select('*')
  const mapa = new Map<string, string | null>()
  for (const r of (data as { grupo: string; fundo: string | null }[]) ?? []) mapa.set(r.grupo, r.fundo)
  return mapa
}

export async function listarCaminatasPorGrupo(): Promise<Map<string, number>> {
  const { data } = await supabase.from('v_caminatas_por_grupo').select('*')
  const mapa = new Map<string, number>()
  for (const r of (data as { grupo: string; caminatas: number }[]) ?? []) mapa.set(r.grupo, r.caminatas)
  return mapa
}

export async function listarCantidadPersonasPorGrupo(): Promise<Map<string, number>> {
  const { data } = await supabase.from('v_grupo_cantidad_personas').select('*')
  const mapa = new Map<string, number>()
  for (const r of (data as { grupo: string; personas: number }[]) ?? []) mapa.set(r.grupo, r.personas)
  return mapa
}

export interface GrupoCosechaActual {
  grupo: string
  fundo: string | null
  personas: number
}

// Cosecha "de verdad" (ver migración 0036): ACTIVIDAD contiene COSECHA y
// MODULO (sufijo de fundo) no está vacío — para Dashboard > Resumen. El
// tablero de conflictividad de Próximas caminatas sigue usando
// listarGrupoFundoActual/listarCantidadPersonasPorGrupo (todos los grupos,
// cualquier actividad), a propósito: no se pidió cambiar ese.
export async function listarGrupoCosechaActual(): Promise<GrupoCosechaActual[]> {
  const { data } = await supabase.from('v_grupo_cosecha_actual').select('*')
  return (data as GrupoCosechaActual[]) ?? []
}
