import { supabase } from './supabaseClient'
import type { Gravedad } from '@/data/categorizacion'

// El Dashboard antes traía TODAS las atenciones y agregaba en el navegador,
// lo que crecía sin límite igual que le pasaba al Historial. Estas vistas ya
// existían en Supabase (0004_views_reportes.sql) pero nunca se usaban: hacen
// el GROUP BY en el servidor y devuelven solo unas pocas filas agregadas,
// sin importar cuántas atenciones haya acumuladas.
export interface CasosPorZona {
  zona: string
  casos: number
  pct: number
}

export interface CasosPorGravedad {
  gravedad: Gravedad
  casos: number
}

export interface CasosPorResponsableGravedad {
  responsable: string
  gravedad: Gravedad
  casos: number
}

export async function obtenerReportesDashboard(): Promise<{
  porZona: CasosPorZona[]
  porGravedad: CasosPorGravedad[]
  porResponsableGravedad: CasosPorResponsableGravedad[]
  error: string | null
}> {
  const [zona, gravedad, responsable] = await Promise.all([
    supabase.from('v_casos_por_zona').select('*'),
    supabase.from('v_casos_por_gravedad').select('*'),
    supabase.from('v_responsable_x_gravedad').select('*'),
  ])
  const error = zona.error?.message ?? gravedad.error?.message ?? responsable.error?.message ?? null
  return {
    porZona: (zona.data as CasosPorZona[]) ?? [],
    porGravedad: (gravedad.data as CasosPorGravedad[]) ?? [],
    porResponsableGravedad: (responsable.data as CasosPorResponsableGravedad[]) ?? [],
    error,
  }
}
