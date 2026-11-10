import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { PDFFont, PDFPage } from 'pdf-lib'
import { fechaCorta } from './fechaLarga'
import { textoFecha, textoDatos } from './plantillaTextos'
import { dibujarBloqueFirma, type FirmaParaPdf } from './generarPdf'
import type { AlertaReportada360 } from '@/types'

// Carta de compromisos de la caminata 360 Laboral (reemplaza, para 360
// Laboral, al documento firmado armado desde una Plantilla PDF subida a
// mano): a diferencia de esa, acá no hay plantilla ni posiciones fijas —
// la carta entera se arma desde cero con pdf-lib porque tiene 3 bloques de
// largo variable (alertas, compromisos del líder, compromisos RRLL), según
// cuántas alertas tenga la caminata, algo que un overlay de posiciones fijas
// no puede representar. Si el contenido no entra en una página, se agregan
// más automáticamente.

const ANCHO_PAGINA = 595.28 // A4
const ALTO_PAGINA = 841.89
const MARGEN = 56
const MARGEN_INFERIOR = 64
const ANCHO_UTIL = ANCHO_PAGINA - MARGEN * 2

const TAMANO_BASE = 10.5
const TAMANO_TITULO = 11.5
const ALTURA_LINEA = TAMANO_BASE * 1.35
const ALTURA_LINEA_TITULO = TAMANO_TITULO * 1.35

// Mismo texto exacto que el checkbox "No se generó compromiso" de
// AlertasReportadas.tsx: así una alerta sin compromiso real queda listada
// (mantiene la numeración 1:1 con "Alertas encontradas") pero sin el sufijo
// de fecha de verificación, que no aplica.
const SIN_COMPROMISO = 'NO SE GENERÓ COMPROMISO'

export interface DatosCartaCompromisos360 {
  fecha: string // YYYY-MM-DD, fecha de la caminata
  grupo: string
  fundo: string
  liderCosecha: string
  celularLider: string | null
  alertas: AlertaReportada360[]
}

interface Cursor {
  pagina: PDFPage
  y: number
}

function nuevaPagina(pdfDoc: PDFDocument): PDFPage {
  return pdfDoc.addPage([ANCHO_PAGINA, ALTO_PAGINA])
}

// Corta un texto en líneas que entran en anchoMax, midiendo con la fuente
// real (no por cantidad de caracteres) — mismo criterio de medición que ya
// usa el pie de firma (fuente.widthOfTextAtSize) en generarPdf.ts.
function partirLineas(texto: string, fuente: PDFFont, tamano: number, anchoMax: number): string[] {
  const palabras = texto.split(/\s+/).filter(Boolean)
  const lineas: string[] = []
  let actual = ''
  for (const palabra of palabras) {
    const candidato = actual ? `${actual} ${palabra}` : palabra
    if (actual && fuente.widthOfTextAtSize(candidato, tamano) > anchoMax) {
      lineas.push(actual)
      actual = palabra
    } else {
      actual = candidato
    }
  }
  if (actual) lineas.push(actual)
  return lineas.length > 0 ? lineas : ['']
}

function saltarPaginaSiNoEntra(pdfDoc: PDFDocument, cursor: Cursor, alturaNecesaria: number) {
  if (cursor.y - alturaNecesaria < MARGEN_INFERIOR) {
    cursor.pagina = nuevaPagina(pdfDoc)
    cursor.y = ALTO_PAGINA - MARGEN
  }
}

function espacio(cursor: Cursor, alto: number) {
  cursor.y -= alto
}

// Una línea simple (sin wrap: encabezados cortos tipo "CHAO, ..." o
// "PRESENTE. -"), con su propio salto de página si no entra.
function linea(pdfDoc: PDFDocument, cursor: Cursor, texto: string, fuente: PDFFont, tamano: number, alturaLinea: number) {
  saltarPaginaSiNoEntra(pdfDoc, cursor, alturaLinea)
  cursor.pagina.drawText(texto, { x: MARGEN, y: cursor.y, size: tamano, font: fuente, color: rgb(0, 0, 0) })
  cursor.y -= alturaLinea
}

// Párrafo con salto de línea automático al ancho útil de la página.
function parrafo(pdfDoc: PDFDocument, cursor: Cursor, texto: string, fuente: PDFFont, tamano: number, alturaLinea: number) {
  for (const l of partirLineas(texto, fuente, tamano, ANCHO_UTIL)) {
    linea(pdfDoc, cursor, l, fuente, tamano, alturaLinea)
  }
}

// Lista numerada "1. texto..." con sangría colgante: si un ítem se parte en
// varias líneas, las de continuación quedan alineadas bajo el texto, no
// bajo el número.
function listaNumerada(pdfDoc: PDFDocument, cursor: Cursor, items: string[], fuente: PDFFont, tamano: number) {
  items.forEach((item, i) => {
    const prefijo = `${i + 1}. `
    const sangria = fuente.widthOfTextAtSize(prefijo, tamano)
    const lineas = partirLineas(item, fuente, tamano, ANCHO_UTIL - sangria)
    lineas.forEach((l, j) => {
      saltarPaginaSiNoEntra(pdfDoc, cursor, ALTURA_LINEA)
      const x = MARGEN + (j === 0 ? 0 : sangria)
      cursor.pagina.drawText(j === 0 ? `${prefijo}${l}` : l, { x, y: cursor.y, size: tamano, font: fuente, color: rgb(0, 0, 0) })
      cursor.y -= ALTURA_LINEA
    })
  })
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

  const cursor: Cursor = { pagina: nuevaPagina(pdfDoc), y: ALTO_PAGINA - MARGEN }

  linea(pdfDoc, cursor, textoFecha(datos.fecha), fuenteNegrita, TAMANO_BASE, ALTURA_LINEA)
  espacio(cursor, 6)
  for (const l of textoDatos(firma.nombre, firma.dni ?? '', datos.celularLider || 'SIN REGISTRAR').split('\n')) {
    linea(pdfDoc, cursor, l, fuenteNegrita, TAMANO_BASE, ALTURA_LINEA)
  }
  espacio(cursor, 14)
  linea(pdfDoc, cursor, 'PRESENTE. -', fuenteNegrita, TAMANO_BASE, ALTURA_LINEA)
  espacio(cursor, 14)
  linea(pdfDoc, cursor, 'De nuestra consideración:', fuente, TAMANO_BASE, ALTURA_LINEA)
  espacio(cursor, 14)

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
