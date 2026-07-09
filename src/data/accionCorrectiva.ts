// Catálogo de ACCIÓN CORRECTIVA, normalizado de las ~35 variantes con typos/tildes
// del Excel (ej. "SUSPENSION 2 DIAS", "SUSPENSIÓN 2 DÍAS", "SUSPENSION DE 2 DIAS"
// eran la misma acción con distinta cantidad de días escrita a mano). Se separa
// la acción del número de días para evitar seguir acumulando variantes.

export const ACCIONES_CORRECTIVAS = [
  'SIN SANCIÓN',
  'FEEDBACK',
  'AMONESTACIÓN ESCRITA',
  'CARTA INDUCTIVA',
  'DECLARACIÓN JURADA',
  'SUSPENSIÓN',
  'ANULADO',
] as const

export type AccionCorrectiva = (typeof ACCIONES_CORRECTIVAS)[number]

export function requiereDias(accion: AccionCorrectiva | ''): boolean {
  return accion === 'SUSPENSIÓN'
}
