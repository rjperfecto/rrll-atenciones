// Grid de la Agenda: 7:00 a 17:00 en bloques de 30 minutos (20 filas).

export const HORA_INICIO_AGENDA = 7 * 60 // minutos desde 00:00
export const HORA_FIN_AGENDA = 17 * 60
const PASO = 30

export const SLOTS_AGENDA: string[] = (() => {
  const slots: string[] = []
  for (let m = HORA_INICIO_AGENDA; m < HORA_FIN_AGENDA; m += PASO) {
    slots.push(formatearMinutos(m))
  }
  return slots
})()

// Incluye las 17:00 (hora fin del último bloque), para el selector de "hora fin".
export const HORAS_FIN_AGENDA: string[] = [...SLOTS_AGENDA.slice(1), formatearMinutos(HORA_FIN_AGENDA)]

function formatearMinutos(totalMin: number): string {
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// Acepta "HH:MM" o "HH:MM:SS" (así devuelve Postgres las columnas `time`).
export function minutosDelDia(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

// Postgres devuelve las columnas `time` como "HH:MM:SS"; los <select> de
// hora usan "HH:MM" (ver SLOTS_AGENDA/HORAS_FIN_AGENDA), así que hay que
// recortar los segundos antes de precargar un registro existente.
export function aHoraCorta(hora: string): string {
  return hora.slice(0, 5)
}

export function filaDeHora(hora: string): number {
  return Math.round((minutosDelDia(hora) - HORA_INICIO_AGENDA) / PASO)
}

export function duracionEnFilas(horaInicio: string, horaFin: string): number {
  return Math.max(1, Math.round((minutosDelDia(horaFin) - minutosDelDia(horaInicio)) / PASO))
}

function alDiaSiguiente(fecha: Date, dias: number): Date {
  const copia = new Date(fecha)
  copia.setDate(copia.getDate() + dias)
  return copia
}

export function aYyyyMmDd(fecha: Date): string {
  const yyyy = fecha.getFullYear()
  const mm = String(fecha.getMonth() + 1).padStart(2, '0')
  const dd = String(fecha.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// Lunes de la semana que contiene `fecha` (lunes=0 ... domingo=6).
export function lunesDeLaSemana(fecha: Date): Date {
  const dia = (fecha.getDay() + 6) % 7
  return alDiaSiguiente(fecha, -dia)
}

export const DIAS_SEMANA_AGENDA = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'] as const

// Lunes a sábado de la semana que contiene `fecha`.
export function diasDeLaSemana(fecha: Date): { fecha: string; etiqueta: string; diaNumero: number }[] {
  const lunes = lunesDeLaSemana(fecha)
  return DIAS_SEMANA_AGENDA.map((etiqueta, i) => {
    const d = alDiaSiguiente(lunes, i)
    return { fecha: aYyyyMmDd(d), etiqueta, diaNumero: d.getDate() }
  })
}

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export function rangoSemanaLegible(dias: { fecha: string }[]): string {
  const inicio = new Date(dias[0].fecha + 'T00:00:00')
  const fin = new Date(dias[dias.length - 1].fecha + 'T00:00:00')
  const mesInicio = MESES_CORTOS[inicio.getMonth()]
  const mesFin = MESES_CORTOS[fin.getMonth()]
  if (mesInicio === mesFin) return `${inicio.getDate()} - ${fin.getDate()} de ${mesFin} ${fin.getFullYear()}`
  return `${inicio.getDate()} ${mesInicio} - ${fin.getDate()} ${mesFin} ${fin.getFullYear()}`
}
