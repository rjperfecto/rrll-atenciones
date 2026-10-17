// Paleta fija de colores para la Agenda de capacitaciones/reuniones (ver
// migración 0027_capacitaciones.sql, columna "color"): el usuario elige uno
// de estos al crear la reunión, no un color libre.

export interface ColorAgenda {
  id: string
  nombre: string
  hex: string
}

// Misma paleta de 11 colores que usa Google Calendar para eventos (mismo
// nombre y hex), traducida al español para la UI.
export const COLORES_AGENDA: ColorAgenda[] = [
  { id: 'tomate', nombre: 'Tomate', hex: '#d50000' },
  { id: 'flamenco', nombre: 'Flamenco', hex: '#e67c73' },
  { id: 'mandarina', nombre: 'Mandarina', hex: '#f4511e' },
  { id: 'platano', nombre: 'Plátano', hex: '#f6bf26' },
  { id: 'salvia', nombre: 'Salvia', hex: '#33b679' },
  { id: 'albahaca', nombre: 'Albahaca', hex: '#0b8043' },
  { id: 'pavo_real', nombre: 'Pavo real', hex: '#039be5' },
  { id: 'arandano', nombre: 'Arándano', hex: '#3f51b5' },
  { id: 'lavanda', nombre: 'Lavanda', hex: '#7986cb' },
  { id: 'uva', nombre: 'Uva', hex: '#8e24aa' },
  { id: 'grafito', nombre: 'Grafito', hex: '#616161' },
]

export function hexDeColor(id: string): string {
  return COLORES_AGENDA.find((c) => c.id === id)?.hex ?? COLORES_AGENDA[0].hex
}
