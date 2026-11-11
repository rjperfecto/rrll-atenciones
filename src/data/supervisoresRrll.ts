// SUP. RRLL no es un campo de entrada libre: se asigna automáticamente según
// la ZONA del caso. Mapeo fijo definido por el equipo de RRLL.

import { supabase } from '@/lib/supabaseClient'
import { obtenerFirmaPersonal, descargarBytesFirmaPersonal } from '@/lib/firmasPersonalApi'
import type { FirmaParaPdf } from '@/lib/generarPdf'
import type { Profile } from '@/types'

const ZONA_A_SUP_RRLL: Record<string, string> = {
  'ZONA 1': 'GABRIELA URQUIAGA',
  'ZONA 2': 'ROXANA SANCHEZ',
  'ZONA 3': 'SANTIAGO VILLENA',
  PACKING: 'ANGIE BOBADILLA',
}

export function supRrllPorZona(zona: string): string | null {
  return ZONA_A_SUP_RRLL[zona] ?? null
}

function normalizarNombre(nombre: string): string {
  return nombre.trim().replace(/\s+/g, ' ').toUpperCase()
}

// Para firmar las cartas de 360 Laboral (compromisos/verificación) con la
// firma guardada del supervisor RRLL, hace falta su cuenta de la
// plataforma (profiles.id) — se busca por NOMBRE contra el mapeo fijo de
// arriba (no por zona_asignada): la firma siempre tiene que corresponder a
// quien el equipo de RRLL definió como supervisor de esa zona (GABRIELA
// URQUIAGA en ZONA 1, etc.), sin depender de cómo esté configurada la zona
// asignada de su cuenta, que puede usarse para otras cosas (alcance de
// datos). Ver migración 0044, que habilita el select para cualquier
// usuario autenticado, no solo el propio perfil o un admin.
export async function buscarSupervisorRrllDeZona(zona: string): Promise<Profile | null> {
  const nombreEsperado = supRrllPorZona(zona)
  if (!nombreEsperado) return null
  const { data } = await supabase.from('profiles').select('*').eq('rol', 'SUPERVISOR')
  const perfiles = (data as Profile[] | null) ?? []
  return perfiles.find((p) => normalizarNombre(p.nombre_completo) === normalizarNombre(nombreEsperado)) ?? null
}

// Nombre + firma (si tiene una guardada en Administración > Firmas de
// personal) del supervisor RRLL de la zona, listos para las cartas de 360
// Laboral. El nombre siempre es el del mapeo fijo de arriba; si todavía no
// hay una cuenta de la plataforma con ese nombre y rol SUPERVISOR, o esa
// cuenta no tiene firma guardada, la carta igual se genera, solo queda el
// nombre en texto, sin firma.
export async function obtenerFirmaSupervisorRrll(zona: string): Promise<{ firma: FirmaParaPdf | null; nombre: string }> {
  const nombre = supRrllPorZona(zona) ?? ''
  const supervisor = await buscarSupervisorRrllDeZona(zona)
  if (!supervisor) return { firma: null, nombre }
  const firmaGuardada = await obtenerFirmaPersonal(supervisor.id)
  if (!firmaGuardada) return { firma: null, nombre }
  const { bytes } = await descargarBytesFirmaPersonal(firmaGuardada.storage_path)
  if (!bytes) return { firma: null, nombre }
  return { firma: { png: new Uint8Array(bytes), nombre }, nombre }
}
