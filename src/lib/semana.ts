// Número de semana ISO-8601 (lunes como inicio de semana, semana 1 = la que
// contiene el primer jueves del año), igual al criterio que usaba el Excel.
export function semanaIso(fechaYyyyMmDd: string): number {
  const fecha = new Date(fechaYyyyMmDd + 'T00:00:00')
  const dia = (fecha.getUTCDay() + 6) % 7 // lunes=0 ... domingo=6
  fecha.setUTCDate(fecha.getUTCDate() - dia + 3)
  const primerJueves = new Date(Date.UTC(fecha.getUTCFullYear(), 0, 4))
  const diaPrimerJueves = (primerJueves.getUTCDay() + 6) % 7
  primerJueves.setUTCDate(primerJueves.getUTCDate() - diaPrimerJueves + 3)
  return 1 + Math.round((fecha.getTime() - primerJueves.getTime()) / (7 * 24 * 60 * 60 * 1000))
}
