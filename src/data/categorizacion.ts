// Catálogo maestro TIPO -> CATEGORIA -> SUBCATEGORIA -> GRAVEDAD
// Extraído y depurado de la hoja "CATEGORIZACIÓN" del Excel histórico (ATENCIONES RRLL-2025.xlsx).
// Es la fuente de verdad única: reemplaza los VLOOKUP rotos del Excel que mezclaban
// números sueltos con BAJO/MEDIO/ALTO en la columna GRAVEDAD.

export type Gravedad = 'BAJO' | 'MEDIO' | 'ALTO'

export type Tipo =
  | 'CONSULTA'
  | 'INTERVENCIÓN'
  | 'RECLAMO'
  | 'COORDINACIÓN'
  | 'SOLICITUD'
  | 'PREVENTIVO'

export interface CategorizacionEntry {
  tipo: Tipo
  categoria: string
  subcategoria: string
  gravedad: Gravedad
}

export const TIPOS: Tipo[] = [
  'CONSULTA',
  'INTERVENCIÓN',
  'RECLAMO',
  'COORDINACIÓN',
  'SOLICITUD',
  'PREVENTIVO',
]

export const CATEGORIZACION: CategorizacionEntry[] = [
  // CONSULTA
  { tipo: 'CONSULTA', categoria: 'APLICAR MEDIDA DISCIPLINARIA', subcategoria: 'DERIVACIÓN A OTRA ÁREA', gravedad: 'BAJO' },
  { tipo: 'CONSULTA', categoria: 'USO DE APLICATIVOS (BERRYDICTO)', subcategoria: 'DERIVACIÓN AL EQUIPO', gravedad: 'BAJO' },
  { tipo: 'CONSULTA', categoria: 'DERIVACIÓN A OTRA ÁREA', subcategoria: 'APLICAR MEDIDA DISCIPLINARIA', gravedad: 'BAJO' },
  { tipo: 'CONSULTA', categoria: 'DERIVACION AL EQUIPO', subcategoria: 'FALLAS EN APLICATIVO', gravedad: 'BAJO' },
  { tipo: 'CONSULTA', categoria: 'CAMBIO DE ÁREA', subcategoria: 'PROCESO DE RRLL', gravedad: 'BAJO' },
  { tipo: 'CONSULTA', categoria: 'PROCESO DE RRLL', subcategoria: 'USO DE APLICATIVOS (BERRYDICTO)', gravedad: 'BAJO' },

  // COORDINACIÓN
  { tipo: 'COORDINACIÓN', categoria: 'CREACIÓN MEDIDA DISCIPLINARIA', subcategoria: 'CREACIÓN MEDIDA DISCIPLINARIA', gravedad: 'BAJO' },
  { tipo: 'COORDINACIÓN', categoria: 'REUNIONES CON PERSONAL OPERARIO', subcategoria: 'REUNIONES CON PERSONAL EMPLEADO', gravedad: 'BAJO' },
  { tipo: 'COORDINACIÓN', categoria: 'REUNIONES CON PERSONAL EMPLEADO', subcategoria: 'REUNIONES CON PERSONAL OPERARIO', gravedad: 'BAJO' },
  { tipo: 'COORDINACIÓN', categoria: 'TRÁMITES SINDICALES', subcategoria: 'TRÁMITES SINDICALES', gravedad: 'MEDIO' },

  // INTERVENCIÓN - ACTOS CONTRA LA BUENA FE LABORAL
  { tipo: 'INTERVENCIÓN', categoria: 'ACTOS CONTRA LA BUENA FE LABORAL', subcategoria: 'MANIPULAR LA INFORMACIÓN EN EL TAREO MÓVIL', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ACTOS CONTRA LA BUENA FE LABORAL', subcategoria: 'PROPORCIONAR A SUS SUPERIORES INFORMACIÓN FALSA SOBRE EL TRABAJO', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ACTOS CONTRA LA BUENA FE LABORAL', subcategoria: 'SUPLANTAR O SOLICITAR SE SUPLANTADO', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ACTOS CONTRA LA BUENA FE LABORAL', subcategoria: 'DELEGAR ACTIVIDADES SIN AUTORIZACIÓN', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ACTOS CONTRA LA BUENA FE LABORAL', subcategoria: 'OCULTAR EL TRABAJO DEFECTUOSO', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ACTOS CONTRA LA BUENA FE LABORAL', subcategoria: 'BRINDAR INFORMACIÓN FALSA', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ACTOS CONTRA LA BUENA FE LABORAL', subcategoria: 'DIFUNDIR PROCESOS INTERNOS', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ACTOS CONTRA LA BUENA FE LABORAL', subcategoria: 'USO DE PODER Y ATRIBUCIONES EN PROVECHO PROPIO O DE TERCEROS', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ACTOS CONTRA LA BUENA FE LABORAL', subcategoria: 'HURTO DE MATERIALES Y/O MATERIA PRIMA', gravedad: 'ALTO' },

  // INTERVENCIÓN - ASISTENCIA Y/O PUNTUALIDAD
  { tipo: 'INTERVENCIÓN', categoria: 'ASISTENCIA Y/O PUNTUALIDAD', subcategoria: 'REGISTRAR ASISTENCIA SIN HABER LABORADO', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ASISTENCIA Y/O PUNTUALIDAD', subcategoria: 'FALTAR AL CENTRO DE TRABAJO SIN JUSTIFICACIÓN', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ASISTENCIA Y/O PUNTUALIDAD', subcategoria: 'LLEGAR TARDE AL CENTRO DE TRABAJO SIN JUSTIFICACIÓN', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ASISTENCIA Y/O PUNTUALIDAD', subcategoria: 'INASISTENCIA INJUSTIFICADA', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ASISTENCIA Y/O PUNTUALIDAD', subcategoria: 'ABANDONO DE TRABAJO', gravedad: 'BAJO' },

  // INTERVENCIÓN - COMPORTAMIENTO
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'AMENAZAR AL PERSONAL', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'AGREDIR VERBAL Y/O FÍSICAMENTE AL PERSONAL', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'DORMIR EN HORARIO DE TRABAJO', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'COMETER ACTOS CONTRA LA MORAL', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'MOTIVAR DISCUSIONES', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'REALIZAR ACTIVIDADES AJENAS AL TRABAJO', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'VENTA AMBULATORIA', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'ASISTIR EN ESTADO DE EBRIEDAD', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'ASISTIR BAJO INFLUENCIA DE DROGAS', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'PORTAR ARMAS DE FUEGO Y/O PUNZOCORTANTES', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'NEGAR BRINDAR EL FOTOCHECK', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'NEGAR FIRMAR O ACEPTAR INCUMPLIMIENTO', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'HOSTIGAMIENTO SEXUAL', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'MOTIVAR PARALIZACIONES', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'MALTRATO O DISCRIMINACIÓN', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'SIMULAR TRABAJAR', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'NEGARSE A FIRMAR MD', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'CAMBIO DE GRUPO SIN AUTORIZACIÓN', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'INSUBORDINACIÓN', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'FALTAR EL RESPETO A TRAVÉS DE ACTOS', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'RETIRARSE DE LAS INSTALACIONES CAMINANDO', gravedad: 'ALTO' },

  // INTERVENCIÓN - EJECUCIÓN DEL TRABAJO
  { tipo: 'INTERVENCIÓN', categoria: 'EJECUCIÓN DEL TRABAJO', subcategoria: 'SUSPENDER INTEMPESTIVAMENTE LABORES', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'EJECUCIÓN DEL TRABAJO', subcategoria: 'RESISTENCIA A CUMPLIR INDICACIONES', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'EJECUCIÓN DEL TRABAJO', subcategoria: 'NO ACATAR CAMBIO DE PUESTO', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'EJECUCIÓN DEL TRABAJO', subcategoria: 'INCUMPLIMIENTOS DE COSECHA', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'EJECUCIÓN DEL TRABAJO', subcategoria: 'INCUMPLIMIENTOS DE LABORES', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'EJECUCIÓN DEL TRABAJO', subcategoria: 'USO Y CUIDADO DE BIENES', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'EJECUCIÓN DEL TRABAJO', subcategoria: 'CONFLICTOS DENTRO DEL GRUPO', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'EJECUCIÓN DEL TRABAJO', subcategoria: 'RESISTENCIA A INICIAR LABORES', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'EJECUCIÓN DEL TRABAJO', subcategoria: 'BAJO RENDIMIENTO', gravedad: 'BAJO' },

  // INTERVENCIÓN - SEGURIDAD Y RIT
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'NO USAR IMPLEMENTOS DE SEGURIDAD', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'INCUMPLIMIENTO EN LA DISPOSICIÓN DE RESIDUOS', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'NO RESPETAR LOS LÍMITES DE VELOCIDAD VEHICULAR', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'TRANSITAR Y/O CAMINAR POR ZONAS RESTRINGIDAS', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'SALIR DE CAMPO CAMINANDO HASTA GARITA SIN ESPERAR LA MOVILIDAD ASIGNADA', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'INGRESAR O RETIRARSE DE LA EMPRESA POR ZONAS NO AUTORIZADAS, SIN PUNTOS DE CONTROL', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'TRANSPORTAR PASAJEROS EN EXCESO A LO PERMITIDO POR LA UNIDAD VEHICULAR Y/O MAQUINARIA', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'VIAJAR EN LA TOLVA DE VEHÍCULO NO ASIGNADA PARA TAL FIN', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'TRANSPORTAR PASAJEROS EN UNIDADES VEHICULARES Y/O MAQUINARIAS NO ASIGNADAS PARA TAL FIN', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'SUBIR O BAJAR DE VEHÍCULOS EN MOVIMIENTO', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'NO RESPETAR LAS SEÑALIZACIONES DE SEGURIDAD', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'REALIZAR ACTOS INSEGUROS', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'NO COMUNICAR ACCIDENTES', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'NO COMUNICAR CONDICIONES INSEGURAS, RIESGOS Y/O PELIGROS', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'SALIR DE LOS BUSES POR LAS VENTANAS', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'PERMITIR/ASIGNAR LABORES DE ALTO RIESGO A PERSONAL NO CALIFICADO O ENTRENADO', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'FUMAR EN LUGARES PÚBLICOS', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'PERMITIR QUE LOS TRABAJADORES A SU CARGO REALICEN LABORES O ACTOS INSEGUROS', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'NO REALIZAR EL PERMISO DE TRABAJO O ANÁLISIS DE RIESGO ANTES DE EJECUTAR LA LABOR', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'NO REALIZAR LA LABOR TENIENDO EN CUENTA EL PERMISO DE TRABAJO O ANÁLISIS DE RIESGO', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'OTRAS FALTAS DE SEGURIDAD', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'OTRAS FALTAS DEL RIT', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'UTILIZAR EQUIPOS NO AUTORIZADOS', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'NO SOMETERSE A EXÁMENES MÉDICOS', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: "NO ENTREGAR EPP'S AL PERSONAL A SU CARGO", gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'NO REALIZAR CHECK LIST ANTES DE OPERAR EQUIPOS', gravedad: 'BAJO' },

  // PREVENTIVO
  { tipo: 'PREVENTIVO', categoria: 'CONDICIONES DE TRABAJO', subcategoria: 'CONDICIONES DE TRABAJO', gravedad: 'BAJO' },
  { tipo: 'PREVENTIVO', categoria: 'CONTROL DE IDENTIDAD', subcategoria: 'CONTROL DE IDENTIDAD', gravedad: 'BAJO' },
  { tipo: 'PREVENTIVO', categoria: 'VISITA PARADEROS', subcategoria: 'VISITA PARADEROS', gravedad: 'BAJO' },
  { tipo: 'PREVENTIVO', categoria: 'DECLARACIÓN DE VÍNCULO', subcategoria: 'DECLARACIÓN DE VÍNCULO', gravedad: 'MEDIO' },
  { tipo: 'PREVENTIVO', categoria: 'DESPLIEGUE DE COMUNICACIÓN', subcategoria: 'DESPLIEGUE DE COMUNICACIÓN', gravedad: 'BAJO' },

  // RECLAMO
  { tipo: 'RECLAMO', categoria: 'DESCANSO TEMPORAL', subcategoria: 'DESCANSO TEMPORAL', gravedad: 'ALTO' },
  { tipo: 'RECLAMO', categoria: 'TAREA EXCESIVA', subcategoria: 'EXCESO DE TAREA', gravedad: 'MEDIO' },
  { tipo: 'RECLAMO', categoria: 'MALTRATO SUPERVISOR', subcategoria: 'MALTRATO SUPERVISOR', gravedad: 'ALTO' },
  { tipo: 'RECLAMO', categoria: 'ODP', subcategoria: 'ODP', gravedad: 'BAJO' },
  { tipo: 'RECLAMO', categoria: 'PÉRDIDA DE JABAS', subcategoria: 'PÉRDIDA DE JABAS', gravedad: 'ALTO' },
  { tipo: 'RECLAMO', categoria: 'PREFERENCIAS EN LA TOMA DE DECISIONES', subcategoria: 'PREFERENCIAS EN LA TOMA DE DECISIONES', gravedad: 'ALTO' },
  { tipo: 'RECLAMO', categoria: 'ROTACIÓN DE ZONA/FUNDO POR BAJA OFERTA DE FRUTA', subcategoria: 'ROTACIÓN DE ZONA/FUNDO POR BAJA OFERTA DE FRUTA', gravedad: 'ALTO' },
  { tipo: 'RECLAMO', categoria: 'APLICACIÓN DE MEDIDAS DISCIPLINARIAS', subcategoria: 'APLICACIÓN DE MEDIDAS DISCIPLINARIAS', gravedad: 'MEDIO' },

  // SOLICITUD
  { tipo: 'SOLICITUD', categoria: 'ENTREGA DE DOCUMENTOS', subcategoria: 'ENTREGA DE DOCUMENTOS', gravedad: 'BAJO' },
  { tipo: 'SOLICITUD', categoria: 'REVISIÓN DE INFORMACIÓN', subcategoria: 'DATA DE NO APTOS', gravedad: 'BAJO' },
  { tipo: 'SOLICITUD', categoria: 'REVISIÓN DE INFORMACIÓN', subcategoria: 'ODP', gravedad: 'BAJO' },
  { tipo: 'SOLICITUD', categoria: 'REVISIÓN DE INFORMACIÓN', subcategoria: 'MEDIDAS DISCIPLINARIAS', gravedad: 'BAJO' },
  { tipo: 'SOLICITUD', categoria: 'REVISIÓN DE INFORMACIÓN', subcategoria: 'REVISIÓN DE INFORMACIÓN', gravedad: 'BAJO' },
  { tipo: 'SOLICITUD', categoria: 'REVISIÓN DE INFORMACIÓN', subcategoria: 'SUNAFIL', gravedad: 'ALTO' },
  { tipo: 'SOLICITUD', categoria: 'CAMBIO DE GRUPO', subcategoria: 'CAMBIO DE GRUPO', gravedad: 'BAJO' },
  { tipo: 'SOLICITUD', categoria: 'CAMBIO DE ACTIVIDAD', subcategoria: 'CAMBIO DE ACTIVIDAD', gravedad: 'BAJO' },
  { tipo: 'SOLICITUD', categoria: 'CAMBIO DE ÁREA', subcategoria: 'CAMBIO DE ÁREA', gravedad: 'BAJO' },
  { tipo: 'SOLICITUD', categoria: 'SUNAFIL', subcategoria: 'SUNAFIL', gravedad: 'BAJO' },
  { tipo: 'SOLICITUD', categoria: 'TRASLADO DE PERSONAL', subcategoria: 'TRASLADO DE PERSONAL', gravedad: 'BAJO' },
]

export function categoriasPorTipo(tipo: Tipo): string[] {
  return [...new Set(CATEGORIZACION.filter((e) => e.tipo === tipo).map((e) => e.categoria))]
}

export function subcategoriasPorCategoria(tipo: Tipo, categoria: string): string[] {
  return [
    ...new Set(
      CATEGORIZACION.filter((e) => e.tipo === tipo && e.categoria === categoria).map((e) => e.subcategoria),
    ),
  ]
}

export function gravedadDe(tipo: Tipo, categoria: string, subcategoria: string): Gravedad | undefined {
  return CATEGORIZACION.find(
    (e) => e.tipo === tipo && e.categoria === categoria && e.subcategoria === subcategoria,
  )?.gravedad
}
