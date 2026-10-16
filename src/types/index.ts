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

export interface AlertaReportada360 {
  categoria: string
  subcategoria: string
  nivel: 'ALTO' | 'MEDIO' | 'BAJO'
  cantidad: number
  // Detalle y acción propios de esta alerta (reemplazan, respectivamente,
  // al antiguo "Detalle de la alerta" general y a la sección "Compromiso"
  // del formulario — ver detalle_alerta y compromiso_generado más abajo).
  detalle: string
  accion: string
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
  total_encuestado: number | null
  tipo_atencion_360: string[] | null
  alertas_reportadas: AlertaReportada360[]
  // Legado: registros creados antes de alertas_reportadas (alertas_360,
  // catálogo plano) o antes de que cada alerta tuviera su propio detalle
  // (detalle_alerta, general) siguen mostrándose con estos campos (ver
  // DetalleAtencionModal / exportXlsx). El formulario ya no escribe en
  // ninguno de los dos.
  alertas_360: string[] | null
  detalle_alerta: string | null
  // Legado: la sección "Compromiso" (generaba un caso pendiente hasta
  // cerrarlo en Compromisos) se quitó del formulario — cada alerta trae su
  // propia Acción (ver alertas_reportadas) y la caminata nace CERRADO. Los
  // compromisos pendientes de antes de este cambio siguen viéndose y
  // cerrándose igual (ver CompromisosList / CerrarCompromisoModal).
  compromiso_generado: boolean | null
  detalle_compromiso: string | null
  fecha_fin_compromiso: string | null
  // Legado: la sección "Evidencia" se eliminó del formulario por no
  // usarse. Solo queda para no perder el dato de registros viejos.
  evidencia_360: string | null
  // Se llena al cerrar un compromiso pendiente (ver CerrarCompromisoModal),
  // igual que accion_correctiva/detalle_cierre para Atenciones normales.
  resultado_compromiso: string | null
  created_at: string
  updated_at: string
}

// Agenda de capacitaciones/reuniones (ver migración 0027): calendario
// semanal compartido, de 7:00 a 17:00 en bloques de media hora. hora_inicio
// y hora_fin vienen de Postgres como "HH:MM:SS".
export interface Capacitacion {
  id: string
  fecha: string // YYYY-MM-DD
  hora_inicio: string // HH:MM:SS
  hora_fin: string // HH:MM:SS
  responsable: string
  tema: string
  ubicacion: string
  color: string // id de COLORES_AGENDA (ver src/data/coloresAgenda.ts)
  creado_por: string
  creado_por_nombre: string
  created_at: string
  updated_at: string
}

// Plantillas PDF (ver migración 0029): un PDF cargado una vez, con
// posiciones configuradas para superponer los datos de un trabajador
// puntual al generarlo (ver Documento / PosicionadorPlantilla).
// Solo dos bloques para ubicar (no uno por dato suelto):
// "datos" = SEÑOR(A)/DNI/CELULAR concatenados en 3 líneas, "fecha" = "CHAO,
// <fecha larga>".
export type CampoPlantilla = 'datos' | 'fecha'

export interface PosicionCampoPlantilla {
  campo: CampoPlantilla
  pagina: number // 1-indexed; por ahora siempre 1 (ver migración 0029)
  x: number // puntos PDF, origen abajo-izquierda
  y: number
  tamano: number // tamaño de fuente en puntos
}

export interface PlantillaPdf {
  id: string
  nombre: string
  storage_path: string
  posiciones: PosicionCampoPlantilla[]
  creado_por: string
  creado_por_nombre: string
  created_at: string
  updated_at: string
}
