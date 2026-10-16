import { supabase } from './supabaseClient'
import type { TrabajadorHistorial, Telefono } from '@/types'

// HERRAMIENTAS > Búsqueda: encontrar a un trabajador o la composición de un
// grupo completo (líder, soportes, cosechadores) con sus celulares. Cruza
// trabajadores_historial (personal importado de TAREO) con telefonos (Excel
// TELEFONOS) por legajo.

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

async function telefonoDeLegajo(legajo: string): Promise<Telefono | null> {
  const { data } = await supabase.from('telefonos').select('*').eq('legajo', legajo).maybeSingle()
  return (data as Telefono) ?? null
}

// Batch (no uno por uno) para no hacer una query por cada soporte/cosechador
// del grupo, que puede tener varias decenas de personas.
async function telefonosDeLegajos(legajos: string[]): Promise<Map<string, string | null>> {
  const mapa = new Map<string, string | null>()
  if (legajos.length === 0) return mapa
  const { data } = await supabase.from('telefonos').select('*').in('legajo', legajos)
  for (const t of (data ?? []) as Telefono[]) {
    mapa.set(t.legajo, t.telefono_1 ?? t.telefono_2 ?? null)
  }
  return mapa
}

// Busca, dentro del mismo día que el resto del grupo, la fila propia del
// líder (para sacar su legajo y así su celular). Si no marcó ese día en ESE
// grupo (ej. supervisa varios), se amplía la búsqueda a cualquier grupo de
// esa misma fecha.
async function filaDelLider(nombreLider: string, fecha: string, grupo: string): Promise<TrabajadorHistorial | null> {
  const nombre = nombreLider.trim()
  if (!nombre) return null

  const { data: enGrupo } = await supabase
    .from('trabajadores_historial')
    .select('*')
    .eq('fecha', fecha)
    .eq('grupo', grupo)
    .eq('nombre_completo', nombre)
    .limit(1)
    .maybeSingle()
  if (enGrupo) return enGrupo as TrabajadorHistorial

  const { data: enOtroGrupo } = await supabase
    .from('trabajadores_historial')
    .select('*')
    .eq('fecha', fecha)
    .eq('nombre_completo', nombre)
    .limit(1)
    .maybeSingle()
  return (enOtroGrupo as TrabajadorHistorial) ?? null
}

export interface PersonaGrupo {
  legajo: string
  nombre_completo: string
  telefono: string | null
}

export type LiderGrupo = PersonaGrupo

export interface ResultadoGrupo {
  grupo: string
  ubicacion: string | null
  fecha: string // fecha real de la foto de datos usada (para mostrar "datos al...")
  lider: LiderGrupo | null
  soportes: PersonaGrupo[]
  cosechadores: PersonaGrupo[]
}

// fechaDeseada (opcional): para Documento masivo, donde el usuario elige a
// mano qué día del grupo quiere (no siempre "el más reciente"). Sin ella,
// se comporta como antes.
export async function buscarGrupoCompleto(grupo: string, fechaDeseada?: string): Promise<ResultadoGrupo | null> {
  const grupoLimpio = grupo.trim().toUpperCase()
  if (!grupoLimpio) return null

  let fecha: string
  if (fechaDeseada) {
    fecha = fechaDeseada
  } else {
    // Última fecha con datos de este grupo (no más allá de hoy).
    const { data: ultima } = await supabase
      .from('trabajadores_historial')
      .select('fecha')
      .eq('grupo', grupoLimpio)
      .lte('fecha', hoy())
      .order('fecha', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!ultima) return null
    fecha = (ultima as { fecha: string }).fecha
  }

  // 2) Foto completa del grupo ese día.
  const { data: filas } = await supabase
    .from('trabajadores_historial')
    .select('*')
    .eq('grupo', grupoLimpio)
    .eq('fecha', fecha)
  const roster = (filas ?? []) as TrabajadorHistorial[]
  if (roster.length === 0) return null

  const ubicacion = roster.find((r) => r.fundo)?.fundo ?? null
  const nombreLider = roster.find((r) => r.sup_cuadrilla)?.sup_cuadrilla ?? null

  let liderLegajo: string | null = null
  let lider: LiderGrupo | null = null
  if (nombreLider) {
    const filaLider = await filaDelLider(nombreLider, fecha, grupoLimpio)
    liderLegajo = filaLider?.legajo ?? null
    const telefono = liderLegajo ? await telefonoDeLegajo(liderLegajo) : null
    lider = {
      legajo: liderLegajo ?? '',
      nombre_completo: nombreLider,
      telefono: telefono?.telefono_1 ?? telefono?.telefono_2 ?? null,
    }
  }

  const resto = roster.filter((r) => r.legajo !== liderLegajo)
  const esSoporte = (area: string | null) => (area ?? '').toUpperCase().includes('SOPORTE')
  const telefonos = await telefonosDeLegajos(resto.map((r) => r.legajo))
  const soportes = resto
    .filter((r) => esSoporte(r.area))
    .map((r) => ({ legajo: r.legajo, nombre_completo: r.nombre_completo, telefono: telefonos.get(r.legajo) ?? null }))
  const cosechadores = resto
    .filter((r) => !esSoporte(r.area))
    .map((r) => ({ legajo: r.legajo, nombre_completo: r.nombre_completo, telefono: telefonos.get(r.legajo) ?? null }))

  return { grupo: grupoLimpio, ubicacion, fecha, lider, soportes, cosechadores }
}

export interface ResultadoTrabajador {
  legajo: string
  nombre_completo: string
  telefono: string | null
  grupo: string | null
  fecha: string // fecha del dato de personal usado (para mostrar "datos al...")
  supervisor: { legajo: string | null; nombre_completo: string; telefono: string | null } | null
}

export async function buscarPorLegajo(legajo: string): Promise<ResultadoTrabajador | null> {
  const legajoLimpio = legajo.trim()
  if (!legajoLimpio) return null

  const { data: trabajador } = await supabase
    .from('trabajadores_historial')
    .select('*')
    .eq('legajo', legajoLimpio)
    .lte('fecha', hoy())
    .order('fecha', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!trabajador) return null
  const t = trabajador as TrabajadorHistorial

  const telefono = await telefonoDeLegajo(t.legajo)

  let supervisor: ResultadoTrabajador['supervisor'] = null
  if (t.sup_cuadrilla) {
    const filaSup = await filaDelLider(t.sup_cuadrilla, t.fecha, t.grupo ?? '')
    const telSup = filaSup ? await telefonoDeLegajo(filaSup.legajo) : null
    supervisor = {
      legajo: filaSup?.legajo ?? null,
      nombre_completo: t.sup_cuadrilla,
      telefono: telSup?.telefono_1 ?? telSup?.telefono_2 ?? null,
    }
  }

  return {
    legajo: t.legajo,
    nombre_completo: t.nombre_completo,
    telefono: telefono?.telefono_1 ?? telefono?.telefono_2 ?? null,
    grupo: t.grupo,
    fecha: t.fecha,
    supervisor,
  }
}
