import { supabase } from './supabaseClient'

// Catálogo Actividad -> Área (ACTIVIDADES-AREA.xlsx, migración 0024): la
// "actividad" cruda que trae TAREO (ej. "INSPECCION CALIDAD – CAE") se
// traduce a un Área más útil para reportes (ej. "CALIDAD"). Si la actividad
// no está en el catálogo (casos ambiguos aún sin clasificar), se usa el
// texto crudo tal cual, sin romper el formulario.
export async function areaDeActividad(actividad: string): Promise<string | null> {
  const texto = actividad.trim()
  if (!texto) return null
  const { data } = await supabase.from('actividad_area').select('area').ilike('actividad', texto).maybeSingle()
  return (data as { area: string } | null)?.area ?? null
}
