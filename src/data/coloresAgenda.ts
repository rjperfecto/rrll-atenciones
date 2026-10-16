// Paleta fija de colores para la Agenda de capacitaciones/reuniones (ver
// migración 0027_capacitaciones.sql, columna "color"): el usuario elige uno
// de estos al crear la reunión, no un color libre.

export interface ColorAgenda {
  id: string
  nombre: string
  hex: string
}

export const COLORES_AGENDA: ColorAgenda[] = [
  { id: 'azul', nombre: 'Azul', hex: '#3b82f6' },
  { id: 'celeste', nombre: 'Celeste', hex: '#06b6d4' },
  { id: 'verde', nombre: 'Verde', hex: '#10b981' },
  { id: 'amarillo', nombre: 'Amarillo', hex: '#f59e0b' },
  { id: 'naranja', nombre: 'Naranja', hex: '#f97316' },
  { id: 'rojo', nombre: 'Rojo', hex: '#ef4444' },
  { id: 'rosado', nombre: 'Rosado', hex: '#ec4899' },
  { id: 'morado', nombre: 'Morado', hex: '#8b5cf6' },
  { id: 'gris', nombre: 'Gris', hex: '#6b7280' },
]

export function hexDeColor(id: string): string {
  return COLORES_AGENDA.find((c) => c.id === id)?.hex ?? COLORES_AGENDA[0].hex
}
