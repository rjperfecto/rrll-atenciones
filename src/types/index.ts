import type { Gravedad, Tipo } from '@/data/categorizacion'

export type Estado = 'ABIERTO' | 'EN_PROCESO' | 'CERRADO'
export type Rol = 'CAMPO' | 'ADMIN'

export interface Profile {
  id: string
  nombre_completo: string
  email: string
  rol: Rol
}

export interface Involucrado {
  dni: string
  nombre_completo: string
  es_afiliado: boolean | null
}

export interface Atencion {
  id: string
  client_uuid: string
  fecha: string // YYYY-MM-DD
  zona: string
  fundo: string | null
  grupo: string | null
  tipo: Tipo
  categoria: string
  subcategoria: string
  gravedad: Gravedad
  comentarios: string | null
  involucrados: Involucrado[]
  cantidad_involucrados: number
  estado: Estado
  detalle_cierre: string | null
  responsable_id: string
  responsable_nombre: string
  created_at: string
  updated_at: string
  synced: boolean
}

export type NuevaAtencionInput = Omit<
  Atencion,
  'id' | 'client_uuid' | 'created_at' | 'updated_at' | 'synced' | 'estado' | 'detalle_cierre'
>
