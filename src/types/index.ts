import type { Gravedad, Tipo } from '@/data/categorizacion'

export type Estado = 'ABIERTO' | 'EN_PROCESO' | 'CERRADO'
export type Rol = 'CAMPO' | 'ADMIN'

export interface Profile {
  id: string
  nombre_completo: string
  email: string
  rol: Rol
}

// Un registro por cada combinación Legajo+Fecha (historial diario de TAREO),
// no un solo "actual" por trabajador — así se puede buscar el dato tal como
// estaba en la fecha del caso.
export interface TrabajadorHistorial {
  legajo: string
  fecha: string // YYYY-MM-DD
  dni: string
  nombre_completo: string
  area: string | null
  fundo: string | null
  grupo: string | null
  sup_cuadrilla: string | null
  updated_at: string
}

export interface Involucrado {
  legajo: string
  dni: string // derivado del legajo (ver src/data/legajo.ts), no se ingresa directo
  nombre_completo: string
  es_afiliado: boolean | null
}

export interface Atencion {
  id: string
  client_uuid: string
  fecha: string // YYYY-MM-DD
  fecha_cierre: string | null // YYYY-MM-DD, se llena al cerrar el caso
  zona: string
  fundo: string | null
  modulo: string | null
  grupo: string | null
  area: string | null
  tipo: Tipo
  categoria: string
  subcategoria: string
  gravedad: Gravedad
  falta: string | null
  comentarios: string | null
  involucrados: Involucrado[]
  estado: Estado
  accion_correctiva: string | null
  dias_suspension: number | null
  detalle_cierre: string | null
  sup_cuadrilla: string | null
  responsable_id: string
  responsable_nombre: string
  sup_rrll: string | null
  reporte: string | null
  antecedente: string | null
  notas_seguimiento: string | null
  created_at: string
  updated_at: string
  synced: boolean
}
