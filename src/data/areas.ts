// Catálogo cerrado de Áreas (ACTIVIDADES-AREA.xlsx, ver migración 0024): las
// 28 categorías a las que se traduce la actividad cruda de TAREO. Se usa
// para el filtro de Área en el historial de Atenciones (antes texto libre).
export const AREAS = [
  'ALMACEN',
  'ATENCION AL TRABAJADOR - FUNDO',
  'CAE',
  'CALIDAD',
  'CAMPAMENTOS Y CONCESIONARIOS',
  'COMUNICACIONES Y CULTURA',
  'COSECHA',
  'DESPACHO',
  'GENETICA',
  'HUB',
  'I&D Y NUEVOS PROYECTOS',
  'INOCUIDAD ALIMENTARIA',
  'LABORATORIO DE SANIDAD',
  'MANTENIMIENTO PLANTA',
  'OPERACIONES Y SERVICIOS GENERALES',
  'POST COSECHA',
  'PRODUCCION ARANDANOS',
  'PRODUCCION PLANTA',
  'PROYECCIONES AGRÍCOLAS',
  'RELACIONES LABORALES',
  'RIEGO',
  'RIEGO CORPORATIVO',
  'SANIDAD',
  'SERVICIOS GENERALES PLANTA',
  'SERVICIOS MEDICOS',
  'TALLER Y MAQUINARIA',
  'TRANSPORTE DE CARGA Y PERSONAL',
  'VIVEROS',
] as const

export type Area = (typeof AREAS)[number]
