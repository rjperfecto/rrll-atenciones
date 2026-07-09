import type { Atencion } from '@/types'

// CSV en vez de una librería de .xlsx: evita dependencias con vulnerabilidades
// sin parche (ver historial del proyecto) y Excel abre .csv sin problema.
// El BOM al inicio asegura que Excel muestre bien las tildes/ñ.

const COLUMNAS = [
  'FECHA',
  'FECHA CIERRE',
  'ZONA',
  'FUNDO',
  'MODULO',
  'GRUPO',
  'AREA',
  'TIPO',
  'CATEGORIA',
  'SUBCATEGORIA',
  'FALTA',
  'GRAVEDAD',
  'DNI',
  'LEGAJO',
  'INVOLUCRADO',
  'CANTIDAD INVOLUCRADOS',
  'AFILIADO',
  'ESTADO',
  'ACCION CORRECTIVA',
  'DIAS SUSPENSION',
  'SUP. CUADRILLA',
  'SUP. RRLL',
  'REPORTE',
  'ANTECEDENTE',
  'NOTAS DE SEGUIMIENTO',
  'COMENTARIOS',
  'DETALLE DEL CIERRE',
  'RESPONSABLE RRLL',
] as const

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function afiliadoTexto(esAfiliado: boolean | null): string {
  if (esAfiliado === null) return ''
  return esAfiliado ? 'SI' : 'NO'
}

export function exportarAtencionesCsv(atenciones: Atencion[]) {
  const filas = atenciones.map((a) => {
    const involucrado = a.involucrados[0]
    const fila: Record<(typeof COLUMNAS)[number], string> = {
      FECHA: a.fecha,
      'FECHA CIERRE': a.fecha_cierre ?? '',
      ZONA: a.zona,
      FUNDO: a.fundo ?? '',
      MODULO: a.modulo ?? '',
      GRUPO: a.grupo ?? '',
      AREA: a.area ?? '',
      TIPO: a.tipo,
      CATEGORIA: a.categoria,
      SUBCATEGORIA: a.subcategoria,
      FALTA: a.falta ?? '',
      GRAVEDAD: a.gravedad,
      DNI: involucrado?.dni ?? '',
      LEGAJO: involucrado?.legajo ?? '',
      INVOLUCRADO: involucrado?.nombre_completo ?? '',
      'CANTIDAD INVOLUCRADOS': String(a.cantidad_involucrados),
      AFILIADO: afiliadoTexto(involucrado?.es_afiliado ?? null),
      ESTADO: a.estado,
      'ACCION CORRECTIVA': a.accion_correctiva ?? '',
      'DIAS SUSPENSION': a.dias_suspension != null ? String(a.dias_suspension) : '',
      'SUP. CUADRILLA': a.sup_cuadrilla ?? '',
      'SUP. RRLL': a.sup_rrll ?? '',
      REPORTE: a.reporte ?? '',
      ANTECEDENTE: a.antecedente ?? '',
      'NOTAS DE SEGUIMIENTO': a.notas_seguimiento ?? '',
      COMENTARIOS: a.comentarios ?? '',
      'DETALLE DEL CIERRE': a.detalle_cierre ?? '',
      'RESPONSABLE RRLL': a.responsable_nombre,
    }
    return fila
  })

  const encabezado = COLUMNAS.join(',')
  const cuerpo = filas
    .map((fila) => COLUMNAS.map((col) => csvEscape(fila[col])).join(','))
    .join('\n')
  const csv = '﻿' + encabezado + '\n' + cuerpo

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const fecha = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = `atenciones_rrll_${fecha}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
