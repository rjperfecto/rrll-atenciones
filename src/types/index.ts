import type { Gravedad, Tipo } from '@/data/categorizacion'

export type Estado = 'ABIERTO' | 'CERRADO'
export type Rol = 'CAMPO' | 'ADMIN' | 'SUPERVISOR'

// Clasificación del registro, independiente de Tipo/Categoría/Subcategoría.
// Por ahora las 3 comparten los mismos campos; a futuro cada una tendrá
// columnas propias (ver migración 0012_tipo_registro.sql).
export type TipoRegistro = 'GENERAL' | 'COSECHA' | '360 LABORAL'

export interface Profile {
  id: string
  nombre_completo: string
  email: string
  rol: Rol
  // Administración > Personal por zona: si está asignada, la Zona de todo lo
  // que este usuario registre en Atenciones/360 Laboral se fuerza a esta,
  // sin importar el fundo/zona del trabajador involucrado ese día.
  zona_asignada: string | null
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
  // Fundo y Packing son archivos distintos, subidos por responsables
  // distintos (ver ImportarPersonal.tsx): cada carga reemplaza solo su
  // propia sede, sin borrar la otra.
  sede: 'FUNDO' | 'PACKING'
  updated_at: string
}

// Lista de afiliados sindicales (Excel AFILIADOS, columna CONTINGENCIA).
// Informativo y de solo lectura: si el legajo no aparece aquí, se asume no afiliado.
export interface Afiliado {
  legajo: string
  nombre_completo: string
  es_afiliado: boolean
  updated_at: string
}

// Directorio de celulares (Excel TELEFONOS), cruzado por legajo con
// trabajadores_historial en HERRAMIENTAS > Búsqueda. No tiene fecha: es un
// solo registro "actual" por legajo, no un historial diario como TAREO.
export interface Telefono {
  legajo: string
  dni: string
  nombre_completo: string
  telefono_1: string | null
  telefono_2: string | null
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
  tipo_registro: TipoRegistro
  fecha: string // YYYY-MM-DD
  fecha_cierre: string | null // YYYY-MM-DD, se llena al cerrar el caso
  zona: string
  fundo: string | null
  modulo: string | null
  grupo: string | null
  area: string | null
  tipo: Tipo | null
  categoria: string | null
  subcategoria: string | null
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
  // Específicos de "360 Laboral" (ver supabase/migrations/0014_form_360_laboral.sql
  // y 0015_separar_360_laboral.sql): registro de sesión/grupo, no de un
  // trabajador individual. Zona/Fundo/Módulo se reutilizan igual que en
  // Atenciones (ver Formulario360Laboral/RegistrarCaminata).
  lider_cosecha: string | null
  alcance: number | null
  tipo_atencion_360: string[] | null
  alertas_360: string[] | null
  detalle_alerta: string | null
  compromiso_generado: boolean | null
  detalle_compromiso: string | null
  fecha_fin_compromiso: string | null
  evidencia_360: string | null
  // Se llena al cerrar un compromiso pendiente (ver CerrarCompromisoModal),
  // igual que accion_correctiva/detalle_cierre para Atenciones normales.
  resultado_compromiso: string | null
  created_at: string
  updated_at: string
}
