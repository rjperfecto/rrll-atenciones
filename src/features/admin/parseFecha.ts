// TAREO trae la fecha como celda de fecha real (Date) o, a veces, como texto
// "DD/MM/YYYY HH:mm:ss". Se usa solo para decidir cuál es la fila más
// reciente por legajo, así que un timestamp aproximado alcanza.
export function timestampDeCelda(valor: unknown): number {
  if (valor instanceof Date) return valor.getTime()
  if (typeof valor === 'string') {
    const m = valor.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[ T]?(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?/)
    if (m) {
      const [, dd, mm, yyyy, hh = '0', min = '0', ss = '0'] = m
      return new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min), Number(ss)).getTime()
    }
    const parsed = Date.parse(valor)
    if (!Number.isNaN(parsed)) return parsed
  }
  return 0
}
