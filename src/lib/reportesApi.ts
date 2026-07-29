import { supabase } from './supabaseClient'
import type { Gravedad } from '@/data/categorizacion'
import type { Estado, TipoRegistro } from '@/types'

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

export interface CasosPorEstado {
  estado: Estado
  casos: number
}

export interface CasosPorSemana {
  anio: number
  semana: number
  casos: number
}

// Cada Dashboard (Atenciones/Cosecha/360 Laboral, ver App.tsx) es la misma
// pantalla filtrada por tipo_registro: las 5 vistas ahora incluyen esa
// columna (migración 0015) para poder filtrar en el servidor sin traer
// todo al cliente.
export async function obtenerReportesDashboard(tipoRegistro: TipoRegistro): Promise<{
  porZona: CasosPorZona[]
  porGravedad: CasosPorGravedad[]
  porResponsableGravedad: CasosPorResponsableGravedad[]
  porEstado: CasosPorEstado[]
  porSemana: CasosPorSemana[]
  error: string | null
}> {
  const [zona, gravedad, responsable, estado, semana] = await Promise.all([
    supabase.from('v_casos_por_zona').select('*').eq('tipo_registro', tipoRegistro),
    supabase.from('v_casos_por_gravedad').select('*').eq('tipo_registro', tipoRegistro),
    supabase.from('v_responsable_x_gravedad').select('*').eq('tipo_registro', tipoRegistro),
    supabase.from('v_casos_por_estado').select('*').eq('tipo_registro', tipoRegistro),
    // Solo se grafican las últimas 12 semanas (ver Dashboard.tsx), así que se
    // pide en ese orden y con ese límite: no tiene sentido bajar años de
    // historial agregado para descartarlo del lado del cliente.
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
    estado.error?.message ??
    semana.error?.message ??
    null
  return {
    porZona: (zona.data as CasosPorZona[]) ?? [],
    porGravedad: (gravedad.data as CasosPorGravedad[]) ?? [],
    porResponsableGravedad: (responsable.data as CasosPorResponsableGravedad[]) ?? [],
    porEstado: (estado.data as CasosPorEstado[]) ?? [],
    porSemana: ((semana.data as CasosPorSemana[]) ?? []).reverse(),
    error,
  }
}
