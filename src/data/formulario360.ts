// Catálogos específicos del formulario "360 Laboral" (conversatorio/
// seguimiento/compromiso con un grupo, no un trabajador individual).
// Ver supabase/migrations/0014_form_360_laboral.sql para las columnas.

export const SEDES_360 = ['PACKING', 'FUNDO'] as const
export type Sede360 = (typeof SEDES_360)[number]

export const PACKING_SEDES = ['PACKING SALAVERRY', 'PACKING CHAO'] as const
export type PackingSede = (typeof PACKING_SEDES)[number]

export const TURNOS_360 = ['DIA', 'NOCHE'] as const
export type Turno360 = (typeof TURNOS_360)[number]

// Fundo de Zona: solo aplica cuando la Zona elegida es 1/2/3 (Packing y
// Oficinas Administrativas no tienen fundo asociado, van directo a Módulo).
export const FUNDOS_POR_ZONA_360: Record<string, string[]> = {
  'ZONA 1': ['ARM 1', 'ARM 2', 'ARM 3', 'ARM 4'],
  'ZONA 2': ['ILU 1', 'ILU 2', 'REM 1', 'REM 2'],
  'ZONA 3': ['ESP 1', 'ESP 2', 'ESP 3', 'SLUI', 'EL TUMI'],
}

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
