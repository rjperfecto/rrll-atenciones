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

const MESES = [
  'ENERO',
  'FEBRERO',
  'MARZO',
  'ABRIL',
  'MAYO',
  'JUNIO',
  'JULIO',
  'AGOSTO',
  'SEPTIEMBRE',
  'OCTUBRE',
  'NOVIEMBRE',
  'DICIEMBRE',
]

// Las primeras 22 columnas (FECHA...Status compromiso) replican exactamente
// nombre y orden del Excel "INDICADORES_ACTUALIZADO.xlsx" (hoja 360 LABORAL),
// para poder pegar/comparar filas directo contra ese reporte. Las 5 últimas
// (RESULTADO COMPROMISO...SUP. RRLL) no existen en ese Excel pero sí se
// capturan en la app, así que se agregan al final para no perder ese dato.
const COLUMNAS_360 = [
  'FECHA',
  'AÑO',
  'MES',
  'SEMANA',
  'Nombre',
  'Grupo',
  'Líder de Cosecha',
  'Nivel de conflictividad',
  'Sede',
  'Turno',
  'Zona',
  'Fundo',
  'Módulo',
  'Actividad',
  'Tipo de atención',
  'Alcance',
  'Alertas',
  'Detalle de la alerta',
  'Compromiso',
  'Detalle compromiso',
  'Fecha fin compromiso',
  'Status compromiso',
  'RESULTADO COMPROMISO',
  'FECHA DE CIERRE',
  'EVIDENCIA',
  'OBSERVACIONES',
  'SUP. RRLL',
] as const

export function exportar360LaboralXlsx(atenciones: Atencion[]) {
  const filas = atenciones.map((a) => {
    const esPacking = a.zona === 'PACKING'
    const fecha = new Date(a.fecha + 'T00:00:00')
    const compromisoSi = a.compromiso_generado === true
    const fila: Record<(typeof COLUMNAS_360)[number], string> = {
      FECHA: a.fecha,
      AÑO: String(fecha.getUTCFullYear()),
      MES: MESES[fecha.getUTCMonth()],
      SEMANA: `SEM ${semanaIso(a.fecha)}`,
      Nombre: a.responsable_nombre.toUpperCase(),
      Grupo: a.grupo ?? '',
      'Líder de Cosecha': a.lider_cosecha ?? '',
      'Nivel de conflictividad': a.gravedad,
      Sede: esPacking ? 'PACKING' : 'FUNDO',
      // Turno solo se captura para sedes PACKING (Día/Noche); en FUNDO la
      // app no registra turno, así que queda vacío en vez de inventar un valor.
      Turno: esPacking ? (a.modulo ?? '') : '',
      Zona: a.zona,
      Fundo: a.fundo ?? '',
      // Para PACKING, "modulo" guarda el turno (ya mostrado arriba), no un
      // módulo real, así que acá queda vacío para no duplicarlo.
      Módulo: esPacking ? '' : (a.modulo ?? ''),
      Actividad: a.area ?? '',
      'Tipo de atención': (a.tipo_atencion_360 ?? []).join(' / '),
      Alcance: a.total_encuestado !== null && a.total_encuestado !== undefined ? String(a.total_encuestado) : '',
      Alertas:
        a.alertas_reportadas.length > 0
          ? a.alertas_reportadas.map((al) => `${al.categoria} > ${al.subcategoria} (${al.nivel}): ${al.cantidad}`).join(' / ')
          : (a.alertas_360 ?? []).join(' / '),
      'Detalle de la alerta': a.detalle_alerta ?? '',
      Compromiso: a.compromiso_generado === true ? 'Se generó un compromiso' : a.compromiso_generado === false ? 'No se generó un compromiso' : '',
      'Detalle compromiso': a.detalle_compromiso ?? '',
      'Fecha fin compromiso': a.fecha_fin_compromiso ?? '',
      'Status compromiso': !compromisoSi ? 'Sin compromiso' : a.estado === 'CERRADO' ? 'Cerrado' : 'Abierto',
      'RESULTADO COMPROMISO': a.resultado_compromiso ?? '',
      'FECHA DE CIERRE': a.fecha_cierre ?? '',
      EVIDENCIA: a.evidencia_360 ?? '',
      OBSERVACIONES: a.comentarios ?? '',
      'SUP. RRLL': a.sup_rrll ?? '',
    }
    return fila
  })
  descargarXlsx(COLUMNAS_360, filas, '360 Laboral', '360_laboral_rrll')
}
