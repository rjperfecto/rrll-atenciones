import { PDFDocument, StandardFonts } from 'pdf-lib'
import { fechaCorta } from './fechaLarga'
import { dibujarBloqueFirma, type FirmaParaPdf } from './generarPdf'
import { dibujarEncabezadoCarta } from './encabezadoCarta'
import { MARGEN, TAMANO_BASE, TAMANO_TITULO, ALTURA_LINEA, ALTURA_LINEA_TITULO, crearCursor, saltarPaginaSiNoEntra, espacio, linea, parrafo, listaNumerada } from './pdfComposer'
import { SIN_COMPROMISO } from '@/data/formulario360'
import type { AlertaReportada360 } from '@/types'

// Carta de compromisos de la caminata 360 Laboral (reemplaza, para 360
// Laboral, al documento firmado armado desde una Plantilla PDF subida a
// mano): a diferencia de esa, acá no hay plantilla ni posiciones fijas —
// la carta entera se arma desde cero con pdf-lib (ver pdfComposer.ts)
// porque tiene 3 bloques de largo variable (alertas, compromisos del
// líder, compromisos RRLL), según cuántas alertas tenga la caminata, algo
// que un overlay de posiciones fijas no puede representar. Si el contenido
// no entra en una página, se agregan más automáticamente.

export interface DatosCartaCompromisos360 {
  fecha: string // YYYY-MM-DD, fecha de la caminata
  grupo: string
  fundo: string
  liderCosecha: string
  alertas: AlertaReportada360[]
}

function lineaCompromiso(texto: string, fechaVerificacion: string): string {
  if (!texto || texto === SIN_COMPROMISO) return SIN_COMPROMISO
  return fechaVerificacion ? `${texto} — Fecha de verificación: ${fechaCorta(fechaVerificacion)}` : texto
}

export async function generarCartaCompromisos360(datos: DatosCartaCompromisos360, firma: FirmaParaPdf): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  // Helvetica (regular) para el cuerpo de la carta, HelveticaBold para
  // encabezados de dato y títulos de sección — mismo par de fuentes
  // estándar (sin licencia) que ya usa el resto del sistema, ver comentario
  // de generarPdf.ts sobre Arial/Helvetica-Bold.
  const fuente = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fuenteNegrita = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const imagenFirma = await pdfDoc.embedPng(firma.png)

  const cursor = crearCursor(pdfDoc)
  await dibujarEncabezadoCarta(pdfDoc, cursor, fuente, fuenteNegrita, { fecha: datos.fecha, nombre: firma.nombre, dni: firma.dni ?? '' })

  parrafo(
    pdfDoc,
    cursor,
    `Por medio de la presente nos dirigimos a usted en el marco del programa Caminata Laboral 360° realizada el ${fechaCorta(datos.fecha)} al grupo ${datos.grupo}, del área ${datos.fundo}, a cargo del líder/supervisor ${datos.liderCosecha}, con el fin de dejar constancia de lo conversado y de los compromisos asumidos.`,
    fuente,
    TAMANO_BASE,
    ALTURA_LINEA,
  )
  espacio(cursor, 14)

  linea(pdfDoc, cursor, 'Alertas encontradas', fuenteNegrita, TAMANO_TITULO, ALTURA_LINEA_TITULO)
  espacio(cursor, 2)
  parrafo(pdfDoc, cursor, 'Durante la visita se identificaron los siguientes aspectos:', fuente, TAMANO_BASE, ALTURA_LINEA)
  espacio(cursor, 4)
  listaNumerada(
    pdfDoc,
    cursor,
    datos.alertas.map((a) => `${a.categoria} - ${a.subcategoria}: ${a.detalle}`),
    fuente,
    TAMANO_BASE,
  )
  espacio(cursor, 14)

  linea(pdfDoc, cursor, 'Compromisos asumidos del líder', fuenteNegrita, TAMANO_TITULO, ALTURA_LINEA_TITULO)
  espacio(cursor, 2)
  parrafo(pdfDoc, cursor, 'A partir de lo anterior, usted se compromete de manera voluntaria a lo siguiente:', fuente, TAMANO_BASE, ALTURA_LINEA)
  espacio(cursor, 4)
  listaNumerada(
    pdfDoc,
    cursor,
    datos.alertas.map((a) => lineaCompromiso(a.accion, a.fecha_verificacion)),
    fuente,
    TAMANO_BASE,
  )
  espacio(cursor, 14)

  linea(pdfDoc, cursor, 'Compromisos asumidos por RRL', fuenteNegrita, TAMANO_TITULO, ALTURA_LINEA_TITULO)
  espacio(cursor, 4)
  listaNumerada(
    pdfDoc,
    cursor,
    datos.alertas.map((a) => lineaCompromiso(a.accion_rrll, a.fecha_verificacion_rrll)),
    fuente,
    TAMANO_BASE,
  )
  espacio(cursor, 14)

  parrafo(
    pdfDoc,
    cursor,
    'Asimismo, le informamos que la Caminata Laboral 360° es un programa permanente de presencia preventiva de Relaciones Laborales en campo, orientado a fortalecer la cercanía con los trabajadores, atender sus consultas, identificar oportunamente alertas y promover un ambiente de trabajo basado en el respeto, la comunicación y la confianza.',
    fuente,
    TAMANO_BASE,
    ALTURA_LINEA,
  )
  espacio(cursor, 8)
  parrafo(
    pdfDoc,
    cursor,
    'La información recogida durante la visita se utiliza exclusivamente con fines preventivos y de mejora organizacional, se trata de forma confidencial y no genera ninguna forma de represalia o discriminación.',
    fuente,
    TAMANO_BASE,
    ALTURA_LINEA,
  )
  espacio(cursor, 20)

  linea(pdfDoc, cursor, 'Atentamente,', fuente, TAMANO_BASE, ALTURA_LINEA)

  // Firma: mismo bloque visual (trazo + línea + nombre + DNI) que el campo
  // "firma" de una Plantilla PDF, ver dibujarBloqueFirma en generarPdf.ts —
  // acá se ubica al cursor en vez de en una posición fija del editor.
  const ANCHO_FIRMA = 180
  const ALTO_TRAZO = 50
  saltarPaginaSiNoEntra(pdfDoc, cursor, ALTO_TRAZO + 24 + 24)
  espacio(cursor, 24)
  const yLineaFirma = cursor.y - ALTO_TRAZO
  dibujarBloqueFirma(cursor.pagina, fuenteNegrita, imagenFirma, firma, MARGEN, yLineaFirma, ANCHO_FIRMA, ALTO_TRAZO)
  cursor.y = yLineaFirma - 24

  return pdfDoc.save()
}
