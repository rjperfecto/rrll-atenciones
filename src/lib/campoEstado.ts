export type EstadoCampo = 'success' | 'warning' | 'error' | 'neutral'

// Deriva el estado visual de un campo a partir de si react-hook-form marcó
// error y si ya tiene contenido. No necesita saber "¿ya lo tocó el usuario?"
// por separado: con mode:'onTouched' en el formulario, RHF solo llena
// `errors` después de un blur o de un intento de envío, así que un campo
// virgen nunca llega acá con error — evita que el form se vea "todo en rojo"
// al cargar.
export function estadoDeCampo(valor: unknown, mensajeError?: string): EstadoCampo {
  const tieneValor = valor !== undefined && valor !== null && valor !== ''
  if (mensajeError) return tieneValor ? 'error' : 'warning'
  if (tieneValor) return 'success'
  return 'neutral'
}

export const CLASE_INPUT_POR_ESTADO: Record<EstadoCampo, string> = {
  success: 'input-success',
  warning: 'input-warning',
  error: 'input-error',
  neutral: '',
}
