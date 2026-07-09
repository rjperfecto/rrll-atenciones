// SUP. RRLL no es un campo de entrada libre: se asigna automáticamente según
// la ZONA del caso. Mapeo fijo definido por el equipo de RRLL.

const ZONA_A_SUP_RRLL: Record<string, string> = {
  'ZONA 1': 'SANTIAGO VILLENA',
  'ZONA 2': 'ROXANA SANCHEZ',
  'ZONA 3': 'GABRIELA URQUIAGA',
  PACKING: 'ANGIE BOBADILLA',
}

export function supRrllPorZona(zona: string): string | null {
  return ZONA_A_SUP_RRLL[zona] ?? null
}
