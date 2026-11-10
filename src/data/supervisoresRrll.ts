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

// Para firmar las cartas de 360 Laboral (compromisos/verificación) con la
// firma guardada del supervisor RRLL, hace falta su cuenta de la plataforma
// (profiles.id), no solo el nombre fijo de arriba — se busca por rol
// SUPERVISOR + zona_asignada (ver migración 0044, que habilita el select
// para cualquier usuario autenticado, no solo el propio perfil o un admin).
export async function buscarSupervisorRrllDeZona(zona: string): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('rol', 'SUPERVISOR').eq('zona_asignada', zona).limit(1).maybeSingle()
  return (data as Profile | null) ?? null
}

// Nombre + firma (si tiene una guardada en Administración > Firmas de
// personal) del supervisor RRLL de la zona, listos para las cartas de 360
// Laboral. Si no hay ningún usuario de la plataforma asignado a esa zona
// como SUPERVISOR todavía, cae al nombre fijo de arriba, sin firma (la
// carta igual se genera, solo queda el nombre en texto).
export async function obtenerFirmaSupervisorRrll(zona: string): Promise<{ firma: FirmaParaPdf | null; nombre: string }> {
  const supervisor = await buscarSupervisorRrllDeZona(zona)
  const nombre = supervisor?.nombre_completo ?? supRrllPorZona(zona) ?? ''
  if (!supervisor) return { firma: null, nombre }
  const firmaGuardada = await obtenerFirmaPersonal(supervisor.id)
  if (!firmaGuardada) return { firma: null, nombre }
  const { bytes } = await descargarBytesFirmaPersonal(firmaGuardada.storage_path)
  if (!bytes) return { firma: null, nombre }
  return { firma: { png: new Uint8Array(bytes), nombre }, nombre }
}
