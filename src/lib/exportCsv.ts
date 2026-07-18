import type { Atencion } from '@/types'
import { semanaIso } from './semana'

// CSV en vez de una librería de .xlsx: evita dependencias con vulnerabilidades
// sin parche (ver historial del proyecto) y Excel abre .csv sin problema.
// El BOM al inicio asegura que Excel muestre bien las tildes/ñ.
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
  'SUP. CUADRILLA',
  'FALTA',
  'ACCION CORRECTIVA',
  'ANTECEDENTE',
  'COMENTARIO',
  'FECHA CIERRE',
  'ESTADO',
  'ÁREA',
  'REPORTE',
  'RESPONSABLE RRLL',
  'SUP. RRLL',
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
      SEMANA: String(semanaIso(a.fecha)),
      GRUPO: a.grupo ?? '',
      TIPO: a.tipo,
      CATEGORIA: a.categoria,
      SUBCATEGORIA: a.subcategoria,
      GRAVEDAD: a.gravedad,
      LEGAJO: involucrado?.legajo ?? '',
      DNI: involucrado?.dni ?? '',
      NOMBRE: involucrado?.nombre_completo ?? '',
      AFILIADO: afiliadoTexto(involucrado?.es_afiliado ?? null),
      ZONA: a.zona,
      FUNDO: a.fundo ?? '',
      MODULO: a.modulo ?? '',
      'SUP. CUADRILLA': a.sup_cuadrilla ?? '',
      FALTA: a.falta ?? a.subcategoria,
      'ACCION CORRECTIVA': a.accion_correctiva ?? '',
      ANTECEDENTE: a.antecedente ?? '',
      COMENTARIO: a.comentarios ?? '',
      'FECHA CIERRE': a.fecha_cierre ?? '',
      ESTADO: a.estado,
      ÁREA: a.area ?? '',
      REPORTE: a.reporte ?? '',
      'RESPONSABLE RRLL': a.responsable_nombre,
      'SUP. RRLL': a.sup_rrll ?? '',
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
