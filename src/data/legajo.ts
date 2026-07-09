// Regla de negocio: el LEGAJO siempre es "10" + los 8 dígitos del DNI.
// El formulario pide LEGAJO; el DNI se deriva automáticamente a partir de él.

export const LEGAJO_REGEX = /^10\d{8}$/

export function legajoValido(legajo: string): boolean {
  return LEGAJO_REGEX.test(legajo)
}

export function dniDesdeLegajo(legajo: string): string {
  return legajo.slice(2)
}
