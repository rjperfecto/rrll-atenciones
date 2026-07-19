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

export async function buscarAfiliadoPorLegajo(legajo: string): Promise<boolean> {
  const { data, error } = await supabase.from('afiliados').select('es_afiliado').eq('legajo', legajo).maybeSingle()
  if (error || !data) return false
  return Boolean((data as { es_afiliado: boolean }).es_afiliado)
}
