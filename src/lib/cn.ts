import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Combina clases condicionales (clsx) y resuelve conflictos de Tailwind
// (tailwind-merge), ej. cn('px-2', condicion && 'px-4') -> 'px-4' gana.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
