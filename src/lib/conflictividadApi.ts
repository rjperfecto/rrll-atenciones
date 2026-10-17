import { supabase } from './supabaseClient'

export type NivelConflictividad = 'BAJO' | 'MEDIO' | 'ALTO'

export interface ConflictividadGrupo {
  grupo: string
  valor: number
  nivel: NivelConflictividad
  updated_at: string
}

export async function listarConflictividad(): Promise<{ data: ConflictividadGrupo[]; error: string | null }> {
  const { data, error } = await supabase.from('conflictividad_grupos').select('*')
  return { data: (data as ConflictividadGrupo[]) ?? [], error: error?.message ?? null }
}

// Reemplazo total (ver migración 0031 e Importar personal, mismo patrón):
// no se acumula historial de cargas, cada import deja la tabla con
// exactamente estas filas.
export async function reemplazarConflictividad(
  filas: { grupo: string; valor: number; nivel: NivelConflictividad }[],
): Promise<{ error: string | null }> {
  // .delete() sin filtro no está permitido por PostgREST; neq con un valor
  // imposible (grupo nunca es '') borra todas las filas igual.
  const { error: errorBorrado } = await supabase.from('conflictividad_grupos').delete().neq('grupo', '')
  if (errorBorrado) return { error: errorBorrado.message }

  const ahora = new Date().toISOString()
  const lote = 500
  for (let i = 0; i < filas.length; i += lote) {
    const { error } = await supabase
      .from('conflictividad_grupos')
      .upsert(filas.slice(i, i + lote).map((f) => ({ ...f, updated_at: ahora })), { onConflict: 'grupo' })
    if (error) return { error: error.message }
  }
  return { error: null }
}
