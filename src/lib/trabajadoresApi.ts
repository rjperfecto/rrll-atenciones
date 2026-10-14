import { supabase } from './supabaseClient'
import type { TrabajadorHistorial } from '@/types'

// La app ya no cachea trabajadores_historial/afiliados localmente: cada
// búsqueda de Legajo consulta Supabase en el momento (una sola fila), en vez
// de sincronizar la tabla completa al iniciar sesión.
export async function buscarTrabajadorPorLegajo(legajo: string, fecha: string): Promise<TrabajadorHistorial | null> {
  const { data, error } = await supabase
    .from('trabajadores_historial')
    .select('*')
    .eq('legajo', legajo)
    .lte('fecha', fecha)
    .order('fecha', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  return data as TrabajadorHistorial
}

// Para "Registrar caminata" (360 Laboral): se busca por número de grupo, no
// por legajo de un supervisor puntual. Cualquier trabajador de ese grupo ese
// día trae el mismo Fundo/Líder de cosecha (sup_cuadrilla), así que alcanza
// con la fila más reciente que matchee el grupo.
export async function buscarTrabajadorPorGrupo(grupo: string, fecha: string): Promise<TrabajadorHistorial | null> {
  const { data, error } = await supabase
    .from('trabajadores_historial')
    .select('*')
    .eq('grupo', grupo)
    .lte('fecha', fecha)
    .order('fecha', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  return data as TrabajadorHistorial
}

export async function buscarAfiliadoPorLegajo(legajo: string): Promise<boolean> {
  const { data, error } = await supabase.from('afiliados').select('es_afiliado').eq('legajo', legajo).maybeSingle()
  if (error || !data) return false
  return Boolean((data as { es_afiliado: boolean }).es_afiliado)
}
