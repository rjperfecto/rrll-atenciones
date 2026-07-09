// Catálogo de zonas. FUNDO ya no usa este catálogo cerrado: el Excel objetivo
// lo guarda como código completo con lote+módulo (ej. "REM 2-W"), así que en el
// formulario es texto libre y el módulo se deriva de ese código (ver lib/modulo.ts).

export const ZONAS = ['CAE', 'OFICINA', 'PACKING', 'ZONA 1', 'ZONA 2', 'ZONA 3'] as const

export type Zona = (typeof ZONAS)[number]
