import type { Zona } from '@/data/zonasFundos'

// Regla de negocio: la Zona se deriva del prefijo del código de Fundo,
// no se ingresa ni se guarda por separado.
const PREFIJOS_ZONA: [string[], Zona][] = [
  [['ARM'], 'ZONA 1'],
  [['REM', 'ILU'], 'ZONA 2'],
  [['TUMI', 'SLUI', 'SL', 'ESP'], 'ZONA 3'],
  [['PACKING'], 'PACKING'],
]

export function zonaDesdeFundo(fundo: string): Zona | null {
  const normalizado = fundo.trim().toUpperCase()
  for (const [prefijos, zona] of PREFIJOS_ZONA) {
    if (prefijos.some((p) => normalizado.startsWith(p))) return zona
  }
  return null
}
