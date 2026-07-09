// MODULO se deriva del código de FUNDO: la letra/código después del último
// guion, ej. "REM 2-W" -> "W", "ARM 1-H" -> "H". Si el fundo no trae guion,
// no hay módulo que derivar.
export function moduloDesdeFundo(fundo: string): string | null {
  const idx = fundo.lastIndexOf('-')
  if (idx === -1) return null
  const modulo = fundo.slice(idx + 1).trim()
  return modulo || null
}
