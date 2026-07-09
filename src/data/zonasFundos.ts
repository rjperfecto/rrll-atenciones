// Catálogo de zonas y fundos canónicos, depurado de las 85 variantes de texto libre
// que existían en la columna FUNDO del Excel (typos, tildes, espacios, sublotes mezclados
// con el nombre del fundo, ej. "ARM 1", "ARM1", "ARM 1-H" -> todos son el fundo ARMONÍA).
// El sublote/anexo específico no se modela aquí; si el equipo lo necesita como campo
// propio, se agrega después sin romper este catálogo.

export const ZONAS = ['CAE', 'OFICINA', 'PACKING', 'ZONA 1', 'ZONA 2', 'ZONA 3'] as const

export const FUNDOS = [
  'ARMONÍA',
  'CAE',
  'CHAO',
  'EL TUMI',
  'ESPERANZA',
  'ILUSIÓN',
  'OFICINA',
  'PACKING',
  'PUERTO MORI',
  'REMANSO',
  'SALAVERRY',
  'SAN LUIS',
] as const

export type Fundo = (typeof FUNDOS)[number]
export type Zona = (typeof ZONAS)[number]
