import { supabase } from './supabaseClient'
import type { TipoRegistro } from '@/types'

export interface CasosPorResponsable {
  responsable: string
  casos: number
}

export interface CasosPorZonaSimple {
  zona: string
  casos: number
}

// Mismo RPC que ya usan los Dashboards de Atenciones/360 Laboral (migración
// 0024), pidiendo TODOS los tipos: sirve para listar qué semanas ISO tienen
// algún dato (fuente de los checkboxes de semana en Resumen).
export async function listarSemanasConDatos(): Promise<{ anio: number; semana: number }[]> {
  const { data } = await supabase.rpc('casos_por_semana', { p_tipos_registro: ['GENERAL', '360 LABORAL'] })
  return ((data as { anio: number; semana: number; casos: number }[]) ?? []).map((s) => ({ anio: s.anio, semana: s.semana }))
}

export async function obtenerCasosPorResponsableSemanas(
  tiposRegistro: TipoRegistro[],
  anio: number | null,
  semanas: number[] | null,
): Promise<{ data: CasosPorResponsable[]; error: string | null }> {
  const { data, error } = await supabase.rpc('casos_por_responsable_semanas', {
    p_tipos_registro: tiposRegistro,
    p_anio: anio,
    p_semanas: semanas,
  })
  return { data: (data as CasosPorResponsable[]) ?? [], error: error?.message ?? null }
}

export async function obtenerCasosPorZonaSemanas(
  tiposRegistro: TipoRegistro[],
  anio: number | null,
  semanas: number[] | null,
): Promise<{ data: CasosPorZonaSimple[]; error: string | null }> {
  const { data, error } = await supabase.rpc('casos_por_zona_semanas', {
    p_tipos_registro: tiposRegistro,
    p_anio: anio,
    p_semanas: semanas,
  })
  return { data: (data as CasosPorZonaSimple[]) ?? [], error: error?.message ?? null }
}
