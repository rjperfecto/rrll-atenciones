// Catálogos específicos del formulario "360 Laboral" (conversatorio/
// seguimiento/compromiso con un grupo, no un trabajador individual).
// Zona/Fundo/Módulo se capturan igual que en Atenciones (ver
// FormularioGeneral "Ubicación"), con una sola diferencia: cuando la Zona
// es PACKING, Fundo y Módulo pasan a ser listas cerradas (el módulo no se
// puede derivar del fundo porque acá representa el turno, no un código).

export const PACKING_FUNDOS = ['PACKING SALAVERRY', 'PACKING CHAO'] as const
export type PackingFundo = (typeof PACKING_FUNDOS)[number]

export const TURNOS_360 = ['DIA', 'NOCHE'] as const
export type Turno360 = (typeof TURNOS_360)[number]

export const TIPOS_ATENCION_360 = ['CONVERSATORIO', 'SEGUIMIENTO', 'COMPROMISO'] as const
export type TipoAtencion360 = (typeof TIPOS_ATENCION_360)[number]

// Catálogo Categoría -> Subcategoría -> Nivel de las alertas de 360 Laboral
// (reemplaza el checkbox plano ALERTAS_360). Cada sesión puede reportar
// varias alertas, cada una con la cantidad de personal que la reportó (ver
// atencion360Schema `alertasReportadas`).
export type NivelAlerta360 = 'ALTO' | 'MEDIO' | 'BAJO'

export interface AlertaCatalogoEntry {
  categoria: string
  subcategoria: string
  nivel: NivelAlerta360
}

export const CATALOGO_ALERTAS_360: AlertaCatalogoEntry[] = [
  { categoria: 'Ambiente laboral', subcategoria: 'Falta de respeto', nivel: 'ALTO' },
  { categoria: 'Ambiente laboral', subcategoria: 'Problemas con el líder', nivel: 'ALTO' },
  { categoria: 'Ambiente laboral', subcategoria: 'Problemas con los soportes', nivel: 'ALTO' },
  { categoria: 'Ambiente laboral', subcategoria: 'Problemas con el tareo', nivel: 'MEDIO' },
  { categoria: 'Ambiente laboral', subcategoria: 'Personal conflictivo', nivel: 'ALTO' },
  { categoria: 'Ambiente laboral', subcategoria: 'Conflicto de intereses', nivel: 'MEDIO' },
  { categoria: 'Ambiente laboral', subcategoria: 'Control de identidad', nivel: 'BAJO' },

  { categoria: 'Hostigamiento', subcategoria: 'Hostigamiento laboral', nivel: 'ALTO' },
  { categoria: 'Hostigamiento', subcategoria: 'Hostigamiento sexual', nivel: 'BAJO' },

  { categoria: 'Procedimiento de trabajo', subcategoria: 'Pérdida de jabas', nivel: 'ALTO' },
  { categoria: 'Procedimiento de trabajo', subcategoria: 'Llenado de jabas', nivel: 'MEDIO' },
  { categoria: 'Procedimiento de trabajo', subcategoria: 'Procedimiento de calidad', nivel: 'MEDIO' },
  { categoria: 'Procedimiento de trabajo', subcategoria: 'Plataformas (Berrydicto)', nivel: 'BAJO' },
  { categoria: 'Procedimiento de trabajo', subcategoria: 'Charlas', nivel: 'BAJO' },

  { categoria: 'Condiciones de trabajo', subcategoria: 'Gestión de comedores', nivel: 'MEDIO' },
  { categoria: 'Condiciones de trabajo', subcategoria: 'Gestantes', nivel: 'BAJO' },
  { categoria: 'Condiciones de trabajo', subcategoria: 'Salud/Servicios médicos', nivel: 'BAJO' },
  { categoria: 'Condiciones de trabajo', subcategoria: 'Transporte', nivel: 'MEDIO' },
  { categoria: 'Condiciones de trabajo', subcategoria: 'Materiales y equipos', nivel: 'BAJO' },
  { categoria: 'Condiciones de trabajo', subcategoria: 'Agua en acopios', nivel: 'BAJO' },
  { categoria: 'Condiciones de trabajo', subcategoria: 'Horario', nivel: 'MEDIO' },
  { categoria: 'Condiciones de trabajo', subcategoria: 'Remuneración/Bonos', nivel: 'ALTO' },

  { categoria: 'Consultas, requerimientos', subcategoria: 'Información general', nivel: 'BAJO' },
  { categoria: 'Consultas, requerimientos', subcategoria: 'Requerimiento de cartas inductivas / reportes de infracción', nivel: 'BAJO' },
  { categoria: 'Consultas, requerimientos', subcategoria: 'Sanciones', nivel: 'BAJO' },
  { categoria: 'Consultas, requerimientos', subcategoria: 'Rotación de grupos/fundo/modulo', nivel: 'ALTO' },

  { categoria: 'Otros', subcategoria: 'Otros', nivel: 'BAJO' },
]

export function categoriasAlerta360(): string[] {
  return [...new Set(CATALOGO_ALERTAS_360.map((e) => e.categoria))]
}

export function subcategoriasAlerta360(categoria: string): string[] {
  return CATALOGO_ALERTAS_360.filter((e) => e.categoria === categoria).map((e) => e.subcategoria)
}

export function nivelAlerta360(categoria: string, subcategoria: string): NivelAlerta360 | undefined {
  return CATALOGO_ALERTAS_360.find((e) => e.categoria === categoria && e.subcategoria === subcategoria)?.nivel
}
