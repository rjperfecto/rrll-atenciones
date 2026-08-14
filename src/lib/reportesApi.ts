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

// Cada Dashboard (Atenciones/Cosecha/360 Laboral, ver App.tsx) es la misma
// pantalla filtrada por tipo_registro (y opcionalmente por semana ISO).
export async function obtenerReportesDashboard(
  tipoRegistro: TipoRegistro,
  filtroSemana?: FiltroSemana | null,
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

  const [zona, gravedad, responsable, zonaGravedad, estado, semana] = await Promise.all([
    supabase.rpc('casos_por_zona', { p_tipo_registro: tipoRegistro, p_anio, p_semana }),
    supabase.rpc('casos_por_gravedad', { p_tipo_registro: tipoRegistro, p_anio, p_semana }),
    supabase.rpc('casos_por_responsable_gravedad', { p_tipo_registro: tipoRegistro, p_anio, p_semana }),
    supabase.rpc('casos_por_zona_gravedad', { p_tipo_registro: tipoRegistro, p_anio, p_semana }),
    supabase.rpc('casos_por_estado', { p_tipo_registro: tipoRegistro, p_anio, p_semana }),
    // La tendencia (últimas 12 semanas) no se filtra por semana: sirve de
    // contexto y es la fuente de opciones del selector de semana.
    supabase
      .from('v_casos_por_semana')
      .select('*')
      .eq('tipo_registro', tipoRegistro)
      .order('anio', { ascending: false })
      .order('semana', { ascending: false })
      .limit(12),
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
    porSemana: ((semana.data as CasosPorSemana[]) ?? []).reverse(),
    error,
  }
}
