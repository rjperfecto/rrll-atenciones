import { supabase } from './supabaseClient'
import type { Gravedad } from '@/data/categorizacion'
import type { Estado, TipoRegistro } from '@/types'

// El Dashboard antes traía TODAS las atenciones y agregaba en el navegador,
// lo que crecía sin límite igual que le pasaba al Historial. Estos RPC
// (migración 0017, antes vistas fijas de 0004/0010/0011/0015) hacen el
// GROUP BY en el servidor y devuelven solo unas pocas filas agregadas, y
// además aceptan filtrar por semana ISO (anio/semana) sin traer nada de más.
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

export interface CasosPorZonaGravedad {
  zona: string
  gravedad: Gravedad
  casos: number
}

export interface CasosPorEstado {
  estado: Estado
  casos: number
}

export interface CasosPorSemana {
  anio: number
  semana: number
  casos: number
}

// null/undefined = sin filtrar esa semana (todas las semanas, igual que antes).
export interface FiltroSemana {
  anio: number
  semana: number
}

// Cada Dashboard (Atenciones y 360 Laboral, ver App.tsx) es la misma pantalla
// filtrada por una lista de tipo_registro, opcionalmente por semana ISO, y
// opcionalmente por Área: ya no se divide Registrar entre GENERAL/COSECHA
// (tipo_registro queda fijo en 'GENERAL' salvo 360 Laboral, ver migración
// 0025) — el Dashboard de Atenciones distingue Cosecha con el selector
// interno TODOS (sin filtro) / COSECHA (area = 'COSECHA').
export async function obtenerReportesDashboard(
  tiposRegistro: TipoRegistro[],
  filtroSemana?: FiltroSemana | null,
  area?: string | null,
): Promise<{
  porZona: CasosPorZona[]
  porGravedad: CasosPorGravedad[]
  porResponsableGravedad: CasosPorResponsableGravedad[]
  porZonaGravedad: CasosPorZonaGravedad[]
  porEstado: CasosPorEstado[]
  porSemana: CasosPorSemana[]
  error: string | null
}> {
  const p_anio = filtroSemana?.anio ?? null
  const p_semana = filtroSemana?.semana ?? null
  const p_area = area ?? null

  const [zona, gravedad, responsable, zonaGravedad, estado, semana] = await Promise.all([
    supabase.rpc('casos_por_zona', { p_tipos_registro: tiposRegistro, p_anio, p_semana, p_area }),
    supabase.rpc('casos_por_gravedad', { p_tipos_registro: tiposRegistro, p_anio, p_semana, p_area }),
    supabase.rpc('casos_por_responsable_gravedad', { p_tipos_registro: tiposRegistro, p_anio, p_semana, p_area }),
    supabase.rpc('casos_por_zona_gravedad', { p_tipos_registro: tiposRegistro, p_anio, p_semana, p_area }),
    supabase.rpc('casos_por_estado', { p_tipos_registro: tiposRegistro, p_anio, p_semana, p_area }),
    // La tendencia (últimas 12 semanas) no se filtra por semana: sirve de
    // contexto y es la fuente de opciones del selector de semana. Suma los
    // tipos pedidos (no una fila por tipo), así que el corte a 12 semanas se
    // hace acá (la función ya viene ordenada ascendente por año/semana).
    supabase.rpc('casos_por_semana', { p_tipos_registro: tiposRegistro, p_area }),
  ])
  const error =
    zona.error?.message ??
    gravedad.error?.message ??
    responsable.error?.message ??
    zonaGravedad.error?.message ??
    estado.error?.message ??
    semana.error?.message ??
    null
  return {
    porZona: (zona.data as CasosPorZona[]) ?? [],
    porGravedad: (gravedad.data as CasosPorGravedad[]) ?? [],
    porResponsableGravedad: (responsable.data as CasosPorResponsableGravedad[]) ?? [],
    porZonaGravedad: (zonaGravedad.data as CasosPorZonaGravedad[]) ?? [],
    porEstado: (estado.data as CasosPorEstado[]) ?? [],
    // La función devuelve todo el historial ascendente; el recorte a las
    // últimas 12 semanas se hace acá (antes lo hacía el .limit(12) del view).
    porSemana: ((semana.data as CasosPorSemana[]) ?? []).slice(-12),
    error,
  }
}
