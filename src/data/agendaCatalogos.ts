// Catálogo cerrado de ubicaciones para la Agenda (ver CapacitacionModal).

export const UBICACIONES_AGENDA = ['MALLA NEGRA', 'SALA DE CAPACITACION - TERRAPUERTO', 'SEMILLERO'] as const
export type UbicacionAgenda = (typeof UBICACIONES_AGENDA)[number]
