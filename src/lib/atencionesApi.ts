import { supabase } from './supabaseClient'
import type { Atencion } from '@/types'

// La app es 100% online: cada operación va directo a Supabase, sin cachear
// ni encolar nada localmente. Si no hay conexión, la operación simplemente falla.

export interface FiltrosAtenciones {
  busqueda?: string
  estado?: string
  gravedad?: string
  zona?: string
  desde?: string
  hasta?: string
}

// El buscador cubre nombre/DNI/legajo (dentro del jsonb involucrados, que
// siempre tiene un solo elemento), fundo, grupo y subcategoria. Se quitan
// coma/parentesis del texto porque rompen la sintaxis de .or() de PostgREST.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aplicarFiltros(query: any, responsableId: string, isAdmin: boolean, filtros: FiltrosAtenciones) {
  let q = query
  if (!isAdmin) q = q.eq('responsable_id', responsableId)
  if (filtros.estado) q = q.eq('estado', filtros.estado)
  if (filtros.gravedad) q = q.eq('gravedad', filtros.gravedad)
  if (filtros.zona) q = q.eq('zona', filtros.zona)
  if (filtros.desde) q = q.gte('fecha', filtros.desde)
  if (filtros.hasta) q = q.lte('fecha', filtros.hasta)
  const texto = filtros.busqueda?.trim().replace(/[,()]/g, '')
  if (texto) {
    const patron = `*${texto}*`
    q = q.or(
      [
        `fundo.ilike.${patron}`,
        `grupo.ilike.${patron}`,
        `subcategoria.ilike.${patron}`,
        `involucrados->0->>nombre_completo.ilike.${patron}`,
        `involucrados->0->>dni.ilike.${patron}`,
        `involucrados->0->>legajo.ilike.${patron}`,
      ].join(','),
    )
  }
  return q
}

// Trae solo la página visible del Historial, con los filtros aplicados en el
// servidor: evita descargar toda la tabla en cada apertura, algo que crecería
// sin límite a medida que se acumulan atenciones.
export async function listarAtencionesPaginado(
  responsableId: string,
  isAdmin: boolean,
  filtros: FiltrosAtenciones,
  pagina: number,
  pageSize: number,
): Promise<{ data: Atencion[]; total: number; error: string | null }> {
  let query = supabase.from('atenciones').select('*', { count: 'exact' }).order('fecha', { ascending: false })
  query = aplicarFiltros(query, responsableId, isAdmin, filtros)
  const desde = (pagina - 1) * pageSize
  const { data, count, error } = await query.range(desde, desde + pageSize - 1)
  return { data: (data as Atencion[]) ?? [], total: count ?? 0, error: error?.message ?? null }
}

// Trae TODAS las atenciones que matchean los filtros actuales, sin paginar:
// solo se usa para el export a CSV (accion explicita del usuario), no en la
// vista normal del Historial.
export async function listarAtencionesParaExportar(
  responsableId: string,
  isAdmin: boolean,
  filtros: FiltrosAtenciones,
): Promise<{ data: Atencion[]; error: string | null }> {
  let query = supabase.from('atenciones').select('*').order('fecha', { ascending: false })
  query = aplicarFiltros(query, responsableId, isAdmin, filtros)
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
  estado: Atencion['estado']
  accion_correctiva: Atencion['accion_correctiva']
}

// Antecedentes disciplinarios del trabajador: solo cuentan las atenciones
// Tipo=INTERVENCIÓN (faltas reales de la Matriz), no consultas/reclamos/etc,
// para ayudar a definir una medida correctiva acorde al historial de la persona.
// Se muestra con qué se cerró cada una (o "PENDIENTE" si aún no se cierra).
export async function buscarAntecedentesPorLegajo(legajo: string, excluirId: string): Promise<AntecedenteFalta[]> {
  const { data, error } = await supabase
    .from('atenciones')
    .select('fecha, subcategoria, estado, accion_correctiva, involucrados')
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
