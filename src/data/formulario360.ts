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

export const ALERTAS_360 = [
  'ACUERDOS MESA DE TRABAJO',
  'CONFLICTO DE INTERESES',
  'CONTROL DE IDENTIDAD',
  'HOSTIGAMIENTO SEXUAL Y LABORAL',
  'IRREGULARIDADES BERRYDICTO',
  'NINGUNA',
] as const
export type Alerta360 = (typeof ALERTAS_360)[number]
