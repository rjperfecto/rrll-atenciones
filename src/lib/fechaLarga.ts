const MESES_LARGOS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

// "2026-10-16" -> "16 de octubre de 2026" (formato pedido para Plantillas PDF).
export function fechaLarga(fechaYyyyMmDd: string): string {
  const [yyyy, mm, dd] = fechaYyyyMmDd.split('-').map(Number)
  return `${dd} de ${MESES_LARGOS[mm - 1]} de ${yyyy}`
}
