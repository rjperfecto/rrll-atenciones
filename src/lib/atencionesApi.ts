import { supabase } from './supabaseClient'
import type { Atencion } from '@/types'

// La app es 100% online: cada operación va directo a Supabase, sin cachear
// ni encolar nada localmente. Si no hay conexión, la operación simplemente falla.
export async function listarAtenciones(
  responsableId: string,
  isAdmin: boolean,
): Promise<{ data: Atencion[]; error: string | null }> {
  let query = supabase.from('atenciones').select('*').order('fecha', { ascending: false })
  if (!isAdmin) query = query.eq('responsable_id', responsableId)
  const { data, error } = await query
  return { data: (data as Atencion[]) ?? [], error: error?.message ?? null }
}

export async function crearAtencion(atencion: Atencion): Promise<{ error: string | null }> {
  const { error } = await supabase.from('atenciones').insert(atencion)
  return { error: error?.message ?? null }
}

export async function cerrarCasoAtencion(
  id: string,
  cambios: Pick<Atencion, 'estado' | 'accion_correctiva' | 'dias_suspension' | 'detalle_cierre' | 'fecha_cierre' | 'updated_at'>,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('atenciones').update(cambios).eq('id', id)
  return { error: error?.message ?? null }
}

export interface AntecedenteFalta {
  fecha: string
  subcategoria: string
  gravedad: Atencion['gravedad']
}

// Antecedentes disciplinarios del trabajador: solo cuentan las atenciones
// Tipo=INTERVENCIÓN (faltas reales de la Matriz), no consultas/reclamos/etc,
// para ayudar a definir una medida correctiva acorde al historial de la persona.
export async function buscarAntecedentesPorLegajo(legajo: string, excluirId: string): Promise<AntecedenteFalta[]> {
  const { data, error } = await supabase
    .from('atenciones')
    .select('fecha, subcategoria, gravedad, involucrados')
    // .contains() genera sintaxis de array de Postgres (cs.{...}) para este
    // caso en vez de JSON (cs.[...]), que Postgres rechaza por ser jsonb;
    // .filter() con el JSON ya serializado evita ese problema.
    .filter('involucrados', 'cs', JSON.stringify([{ legajo }]))
    .eq('tipo', 'INTERVENCIÓN')
    .neq('id', excluirId)
    .order('fecha', { ascending: false })
  if (error || !data) return []
  return data as AntecedenteFalta[]
}
