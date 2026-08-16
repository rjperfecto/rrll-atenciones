import { utils, writeFile } from 'xlsx'
import type { Atencion } from '@/types'
import { semanaIso } from './semana'

// .xlsx (Excel real) en vez de .csv: se abre directo en Excel con las
// columnas ya tipadas, sin los problemas de acentos/comas que traía el CSV.
// Usa la misma build de SheetJS (parcheada, ver README) que ya lee los
// Excel de TAREO/Teléfonos en Administración (src/features/admin/leerXlsx.ts).
// Orden y nombres de columnas replican exactamente el Excel objetivo
// "ATENCIONES NUEVO.xlsx" (hoja ZONA 2).

const COLUMNAS = [
  'FECHA',
  'SEMANA',
  'GRUPO',
  'TIPO',
  'CATEGORIA',
  'SUBCATEGORIA',
  'GRAVEDAD',
  'LEGAJO',
  'DNI',
  'NOMBRE',
  'AFILIADO',
  'ZONA',
  'FUNDO',
  'MODULO',
  'LIDER DE COSECHA',
  'FALTA',
  'ACCION CORRECTIVA',
  'ANTECEDENTE',
  'COMENTARIO',
  'FECHA CIERRE',
  'ESTADO',
  'ÁREA',
  'REPORTA',
  'RESPONSABLE RRLL',
  'SUP. RRLL',
] as const

function afiliadoTexto(esAfiliado: boolean | null): string {
  if (esAfiliado === null) return ''
  return esAfiliado ? 'SI' : 'NO'
}

function descargarXlsx(columnas: readonly string[], filas: Record<string, string>[], nombreHoja: string, nombreBase: string) {
  const aoa = [columnas as string[], ...filas.map((fila) => columnas.map((c) => fila[c] ?? ''))]
  const hoja = utils.aoa_to_sheet(aoa)
  const libro = utils.book_new()
  utils.book_append_sheet(libro, hoja, nombreHoja)
  const fecha = new Date().toISOString().slice(0, 10)
  writeFile(libro, `${nombreBase}_${fecha}.xlsx`)
}

export function exportarAtencionesXlsx(atenciones: Atencion[]) {
  const filas = atenciones.map((a) => {
    const involucrado = a.involucrados[0]
    const fila: Record<(typeof COLUMNAS)[number], string> = {
      FECHA: a.fecha,
      SEMANA: String(semanaIso(a.fecha)),
      GRUPO: a.grupo ?? '',
      TIPO: a.tipo ?? '',
      CATEGORIA: a.categoria ?? '',
      SUBCATEGORIA: a.subcategoria ?? '',
      GRAVEDAD: a.gravedad,
      LEGAJO: involucrado?.legajo ?? '',
      DNI: involucrado?.dni ?? '',
      NOMBRE: involucrado?.nombre_completo ?? '',
      AFILIADO: afiliadoTexto(involucrado?.es_afiliado ?? null),
      ZONA: a.zona,
      FUNDO: a.fundo ?? '',
      MODULO: a.modulo ?? '',
      'LIDER DE COSECHA': a.sup_cuadrilla ?? '',
      FALTA: a.falta ?? a.subcategoria ?? '',
      'ACCION CORRECTIVA': a.accion_correctiva ?? '',
      ANTECEDENTE: a.antecedente ?? '',
      COMENTARIO: a.comentarios ?? '',
      'FECHA CIERRE': a.fecha_cierre ?? '',
      ESTADO: a.estado,
      ÁREA: a.area ?? '',
      REPORTA: a.reporte ?? '',
      'RESPONSABLE RRLL': a.responsable_nombre.toUpperCase(),
      'SUP. RRLL': a.sup_rrll ?? '',
    }
    return fila
  })
  descargarXlsx(COLUMNAS, filas, 'Atenciones', 'atenciones_rrll')
}

// Columnas propias de 360 Laboral: es un registro de sesión/grupo (no un
// trabajador individual), así que no comparte columnas con el export de
// arriba (Tipo/Categoría/Legajo/etc. no aplican acá).
const COLUMNAS_360 = [
  'FECHA',
  'SEMANA',
  'NIVEL DE CONFLICTIVIDAD',
  'LIDER DE COSECHA',
  'GRUPO',
  'ALCANCE',
  'ZONA',
  'FUNDO',
  'MODULO',
  'ACTIVIDAD',
  'TIPO DE ATENCION',
  'ALERTAS',
  'DETALLE DE LA ALERTA',
  'COMPROMISO',
  'DETALLE COMPROMISO',
  'FECHA FIN COMPROMISO',
  'RESULTADO COMPROMISO',
  'FECHA DE CIERRE',
  'EVIDENCIA',
  'OBSERVACIONES',
  'RESPONSABLE RRLL',
  'SUP. RRLL',
] as const

export function exportar360LaboralXlsx(atenciones: Atencion[]) {
  const filas = atenciones.map((a) => {
    const fila: Record<(typeof COLUMNAS_360)[number], string> = {
      FECHA: a.fecha,
      SEMANA: String(semanaIso(a.fecha)),
      'NIVEL DE CONFLICTIVIDAD': a.gravedad,
      'LIDER DE COSECHA': a.lider_cosecha ?? '',
      GRUPO: a.grupo ?? '',
      ALCANCE: a.alcance !== null && a.alcance !== undefined ? String(a.alcance) : '',
      ZONA: a.zona,
      FUNDO: a.fundo ?? '',
      MODULO: a.modulo ?? '',
      ACTIVIDAD: a.area ?? '',
      'TIPO DE ATENCION': (a.tipo_atencion_360 ?? []).join(' / '),
      ALERTAS: (a.alertas_360 ?? []).join(' / '),
      'DETALLE DE LA ALERTA': a.detalle_alerta ?? '',
      COMPROMISO: a.compromiso_generado === true ? 'SI' : a.compromiso_generado === false ? 'NO' : '',
      'DETALLE COMPROMISO': a.detalle_compromiso ?? '',
      'FECHA FIN COMPROMISO': a.fecha_fin_compromiso ?? '',
      'RESULTADO COMPROMISO': a.resultado_compromiso ?? '',
      'FECHA DE CIERRE': a.fecha_cierre ?? '',
      EVIDENCIA: a.evidencia_360 ?? '',
      OBSERVACIONES: a.comentarios ?? '',
      'RESPONSABLE RRLL': a.responsable_nombre.toUpperCase(),
      'SUP. RRLL': a.sup_rrll ?? '',
    }
    return fila
  })
  descargarXlsx(COLUMNAS_360, filas, '360 Laboral', '360_laboral_rrll')
}
