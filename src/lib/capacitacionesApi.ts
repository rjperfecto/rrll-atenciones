import { supabase } from './supabaseClient'
import type { Capacitacion } from '@/types'

// Agenda de capacitaciones/reuniones: agenda compartida (todos ven todo),
// ver migración 0027_capacitaciones.sql. Editar/borrar está limitado por
// RLS a quien la creó o ADMIN; el front igual oculta esos botones para no
// mostrar una acción que el servidor va a rechazar (ver AgendaCapacitaciones).

export async function listarCapacitacionesRango(desde: string, hasta: string): Promise<{ data: Capacitacion[]; error: string | null }> {
  const { data, error } = await supabase
    .from('capacitaciones')
    .select('*')
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .order('fecha', { ascending: true })
    .order('hora_inicio', { ascending: true })
  return { data: (data as Capacitacion[]) ?? [], error: error?.message ?? null }
}

export async function crearCapacitacion(capacitacion: Omit<Capacitacion, 'created_at' | 'updated_at'>): Promise<{ error: string | null }> {
  const now = new Date().toISOString()
  const { error } = await supabase.from('capacitaciones').insert({ ...capacitacion, created_at: now, updated_at: now })
  return { error: error?.message ?? null }
}

export async function editarCapacitacion(
  id: string,
  cambios: Partial<Pick<Capacitacion, 'fecha' | 'hora_inicio' | 'hora_fin' | 'responsable' | 'tema' | 'ubicacion' | 'color'>>,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('capacitaciones').update({ ...cambios, updated_at: new Date().toISOString() }).eq('id', id)
  return { error: error?.message ?? null }
}

export async function eliminarCapacitacion(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('capacitaciones').delete().eq('id', id)
  return { error: error?.message ?? null }
}
