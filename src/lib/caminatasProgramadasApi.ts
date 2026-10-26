import { supabase } from './supabaseClient'
import type { CaminataProgramada } from '@/types'

// "Próximas caminatas" (Compromisos > 360 Laboral): ver migración 0030.
export async function listarCaminatasProgramadas(): Promise<{ data: CaminataProgramada[]; error: string | null }> {
  const { data, error } = await supabase
    .from('caminatas_programadas')
    .select('*')
    .order('fecha', { ascending: true })
  return { data: (data as CaminataProgramada[]) ?? [], error: error?.message ?? null }
}

export async function programarCaminata(
  grupo: string,
  fecha: string,
  creadoPor: string,
  creadoPorNombre: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('caminatas_programadas').insert({
    id: crypto.randomUUID(),
    grupo: grupo.trim().toUpperCase(),
    fecha,
    creado_por: creadoPor,
    creado_por_nombre: creadoPorNombre.toUpperCase(),
    created_at: new Date().toISOString(),
  })
  return { error: error?.message ?? null }
}

export async function eliminarCaminataProgramada(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('caminatas_programadas').delete().eq('id', id)
  return { error: error?.message ?? null }
}
