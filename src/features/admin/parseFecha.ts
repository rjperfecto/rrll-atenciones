// TAREO trae la fecha como celda de fecha real (Date) o, a veces, como texto
// "DD/MM/YYYY HH:mm:ss". Se usa para decidir cuál es la fila más reciente
// dentro de un mismo día, y para saber a qué día calendario pertenece cada fila.
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

// Día calendario (YYYY-MM-DD) de la celda, ignorando la hora. Se usa como
// parte de la clave de deduplicación (Legajo + día), no solo Legajo.
export function fechaSoloDia(valor: unknown): string | null {
  const ts = timestampDeCelda(valor)
  if (!ts) return null
  const fecha = new Date(ts)
  const yyyy = fecha.getFullYear()
  const mm = String(fecha.getMonth() + 1).padStart(2, '0')
  const dd = String(fecha.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
