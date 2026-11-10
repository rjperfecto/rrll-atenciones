import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { fechaCorta } from './fechaLarga'
import { dibujarBloqueFirma, type FirmaParaPdf } from './generarPdf'
import { dibujarEncabezadoCarta } from './encabezadoCarta'
import {
  MARGEN,
  ANCHO_UTIL,
  TAMANO_BASE,
  TAMANO_TITULO,
  ALTURA_LINEA,
  ALTURA_LINEA_TITULO,
  crearCursor,
  saltarPaginaSiNoEntra,
  espacio,
  linea,
  parrafo,
  partirLineas,
  type Cursor,
} from './pdfComposer'
import { ETIQUETA_ESTADO_VERIFICACION, type EstadoVerificacionCompromiso, type ResultadoVerificacion } from '@/data/formulario360'
import type { AlertaReportada360 } from '@/types'
import type { PDFFont } from 'pdf-lib'

// Carta de verificación de compromisos de 360 Laboral: se genera al cerrar
// o dar seguimiento a una ronda de verificación (ver VerificarCompromisosModal
// y migración 0043). Mismo motor de armado dinámico que cartaCompromisos360.ts
// (ver pdfComposer.ts), con dos firmas en vez de una: la del responsable de
// RRLL que verifica (opcional, desde Firmas de personal) y la del
// trabajador que toma conocimiento del resultado (en vivo, FirmaCanvas).

export interface DatosCartaVerificacion360 {
  fechaCartaAnterior: string // YYYY-MM-DD: fecha de la ronda/carta inmediatamente anterior
  fechaVisita: string // YYYY-MM-DD: fecha de la caminata original (raíz de la cadena)
  grupo: string
  fundo: string
  liderCosecha: string
  // Ya con verificacion_lider/verificacion_rrll completados por el
  // miniformulario — acá solo se listan los que sí tenían un compromiso
  // real (SIN_COMPROMISO no se verifica, no hay nada que constatar).
  alertas: AlertaReportada360[]
  observaciones: string
  resultado: ResultadoVerificacion
  nuevaFechaVerificacion: string | null // solo si resultado === SEGUIMIENTO_ADICIONAL
  responsableNombre: string
  fechaRecepcion: string // YYYY-MM-DD: cuándo firma el trabajador
}

function listaVerificacion(
  pdfDoc: PDFDocument,
  cursor: Cursor,
  items: { texto: string; estado: EstadoVerificacionCompromiso; detalle: string }[],
  fuente: PDFFont,
  fuenteNegrita: PDFFont,
) {
  items.forEach((item) => {
    const prefijo = '• '
    const sangria = fuente.widthOfTextAtSize(prefijo, TAMANO_BASE)
    const lineasTexto = partirLineas(item.texto, fuente, TAMANO_BASE, ANCHO_UTIL - sangria)
    lineasTexto.forEach((l, j) => {
      saltarPaginaSiNoEntra(pdfDoc, cursor, ALTURA_LINEA)
      const x = MARGEN + (j === 0 ? 0 : sangria)
      cursor.pagina.drawText(j === 0 ? `${prefijo}${l}` : l, { x, y: cursor.y, size: TAMANO_BASE, font: fuente, color: rgb(0, 0, 0) })
      cursor.y -= ALTURA_LINEA
    })
    const textoEstado = `Estado: ${ETIQUETA_ESTADO_VERIFICACION[item.estado]}${item.detalle ? ` — Detalle: ${item.detalle}` : ''}`
    for (const l of partirLineas(textoEstado, fuenteNegrita, TAMANO_BASE, ANCHO_UTIL - sangria)) {
      saltarPaginaSiNoEntra(pdfDoc, cursor, ALTURA_LINEA)
      cursor.pagina.drawText(l, { x: MARGEN + sangria, y: cursor.y, size: TAMANO_BASE, font: fuenteNegrita, color: rgb(0, 0, 0) })
      cursor.y -= ALTURA_LINEA
    }
    espacio(cursor, 3)
  })
}

export async function generarCartaVerificacion360(
  datos: DatosCartaVerificacion360,
  firmaResponsable: FirmaParaPdf | null,
  firmaTrabajador: FirmaParaPdf,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const fuente = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fuenteNegrita = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const imagenFirmaResponsable = firmaResponsable ? await pdfDoc.embedPng(firmaResponsable.png) : null
  const imagenFirmaTrabajador = await pdfDoc.embedPng(firmaTrabajador.png)

  const cursor = crearCursor(pdfDoc)
  await dibujarEncabezadoCarta(pdfDoc, cursor, fuente, fuenteNegrita, {
    fecha: datos.fechaRecepcion,
    nombre: firmaTrabajador.nombre,
    dni: firmaTrabajador.dni ?? '',
  })

  parrafo(
    pdfDoc,
    cursor,
    `Por medio de la presente, en el marco del programa Caminata Laboral 360°, Relaciones Laborales deja constancia de la verificación de los compromisos asumidos por usted en la carta de fecha ${fechaCorta(datos.fechaCartaAnterior)}, emitida tras la visita realizada el ${fechaCorta(datos.fechaVisita)} al grupo ${datos.grupo}, del área ${datos.fundo}, a cargo del líder/supervisor ${datos.liderCosecha}.`,
    fuente,
    TAMANO_BASE,
    ALTURA_LINEA,
  )
  espacio(cursor, 14)

  linea(pdfDoc, cursor, 'Resultado de la verificación', fuenteNegrita, TAMANO_TITULO, ALTURA_LINEA_TITULO)
  espacio(cursor, 2)
  parrafo(pdfDoc, cursor, 'En la fecha indicada se verificó el estado de cada compromiso, con el siguiente resultado:', fuente, TAMANO_BASE, ALTURA_LINEA)
  espacio(cursor, 6)

  const compromisosLider = datos.alertas
    .filter((a) => a.verificacion_lider)
    .map((a) => ({ texto: a.accion, estado: a.verificacion_lider as EstadoVerificacionCompromiso, detalle: a.verificacion_lider_detalle ?? '' }))
  if (compromisosLider.length > 0) {
    linea(pdfDoc, cursor, 'Compromisos del líder', fuenteNegrita, TAMANO_BASE, ALTURA_LINEA)
    espacio(cursor, 2)
    listaVerificacion(pdfDoc, cursor, compromisosLider, fuente, fuenteNegrita)
    espacio(cursor, 10)
  }

  const compromisosRrll = datos.alertas
    .filter((a) => a.verificacion_rrll)
    .map((a) => ({ texto: a.accion_rrll, estado: a.verificacion_rrll as EstadoVerificacionCompromiso, detalle: a.verificacion_rrll_detalle ?? '' }))
  if (compromisosRrll.length > 0) {
    linea(pdfDoc, cursor, 'Compromisos de RRLL', fuenteNegrita, TAMANO_BASE, ALTURA_LINEA)
    espacio(cursor, 2)
    listaVerificacion(pdfDoc, cursor, compromisosRrll, fuente, fuenteNegrita)
    espacio(cursor, 10)
  }

  linea(pdfDoc, cursor, 'Observaciones', fuenteNegrita, TAMANO_BASE, ALTURA_LINEA)
  parrafo(pdfDoc, cursor, datos.observaciones || 'Ninguna.', fuente, TAMANO_BASE, ALTURA_LINEA)
  espacio(cursor, 14)

  linea(pdfDoc, cursor, 'Resultado general', fuenteNegrita, TAMANO_TITULO, ALTURA_LINEA_TITULO)
  espacio(cursor, 2)
  parrafo(
    pdfDoc,
    cursor,
    datos.resultado === 'CIERRE_EFECTIVO'
      ? 'Cierre efectivo: los compromisos fueron cumplidos y se da por cerrado el seguimiento.'
      : `Seguimiento adicional: se mantiene en seguimiento. Nueva fecha de verificación: ${fechaCorta(datos.nuevaFechaVerificacion ?? '')}.`,
    fuente,
    TAMANO_BASE,
    ALTURA_LINEA,
  )
  espacio(cursor, 14)

  parrafo(
    pdfDoc,
    cursor,
    'Le recordamos que, según el protocolo del programa, Relaciones Laborales da seguimiento a los compromisos hasta verificar su cierre efectivo con la evidencia correspondiente. Agradecemos su disposición y colaboración.',
    fuente,
    TAMANO_BASE,
    ALTURA_LINEA,
  )
  espacio(cursor, 20)

  linea(pdfDoc, cursor, 'Atentamente,', fuente, TAMANO_BASE, ALTURA_LINEA)
  espacio(cursor, 4)

  // Firma del responsable de RRLL que verifica: si tiene una firma guardada
  // (Administración > Firmas de personal) se dibuja el trazo, si no, solo
  // el nombre en texto — no bloquea la generación de la carta.
  if (imagenFirmaResponsable && firmaResponsable) {
    const ANCHO_FIRMA = 160
    const ALTO_TRAZO = 40
    saltarPaginaSiNoEntra(pdfDoc, cursor, ALTO_TRAZO + 20)
    const yLineaFirma = cursor.y - ALTO_TRAZO
    dibujarBloqueFirma(cursor.pagina, fuenteNegrita, imagenFirmaResponsable, firmaResponsable, MARGEN, yLineaFirma, ANCHO_FIRMA, ALTO_TRAZO)
    cursor.y = yLineaFirma - 20
  } else {
    linea(pdfDoc, cursor, datos.responsableNombre.toUpperCase(), fuenteNegrita, TAMANO_BASE, ALTURA_LINEA)
  }
  linea(pdfDoc, cursor, 'Relaciones Laborales — Hortifrut Perú S.A.C.', fuente, TAMANO_BASE, ALTURA_LINEA)
  espacio(cursor, 24)

  linea(pdfDoc, cursor, 'Tomé conocimiento del resultado de la verificación:', fuente, TAMANO_BASE, ALTURA_LINEA)

  const ANCHO_FIRMA_TRABAJADOR = 180
  const ALTO_TRAZO_TRABAJADOR = 50
  saltarPaginaSiNoEntra(pdfDoc, cursor, ALTO_TRAZO_TRABAJADOR + 44)
  espacio(cursor, 20)
  const yLineaFirmaTrabajador = cursor.y - ALTO_TRAZO_TRABAJADOR
  dibujarBloqueFirma(cursor.pagina, fuenteNegrita, imagenFirmaTrabajador, firmaTrabajador, MARGEN, yLineaFirmaTrabajador, ANCHO_FIRMA_TRABAJADOR, ALTO_TRAZO_TRABAJADOR)
  cursor.y = yLineaFirmaTrabajador - 22
  linea(pdfDoc, cursor, `Fecha de recepción: ${fechaCorta(datos.fechaRecepcion)}`, fuente, TAMANO_BASE, ALTURA_LINEA)

  return pdfDoc.save()
}
