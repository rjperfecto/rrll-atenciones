import { rgb } from 'pdf-lib'
import type { PDFDocument, PDFFont, PDFPage } from 'pdf-lib'

// Motor de armado de cartas dinámicas (sin plantilla, sin posiciones
// fijas): párrafos con salto de línea automático, listas numeradas con
// sangría colgante y salto de página cuando el contenido no entra — usado
// tanto por cartaCompromisos360.ts como por cartaVerificacion360.ts, que
// comparten exactamente este mismo armado de página A4.

export const ANCHO_PAGINA = 595.28 // A4
export const ALTO_PAGINA = 841.89
export const MARGEN = 56
export const MARGEN_INFERIOR = 64
export const ANCHO_UTIL = ANCHO_PAGINA - MARGEN * 2

export const TAMANO_BASE = 10.5
export const TAMANO_TITULO = 11.5
export const ALTURA_LINEA = TAMANO_BASE * 1.35
export const ALTURA_LINEA_TITULO = TAMANO_TITULO * 1.35

export interface Cursor {
  pagina: PDFPage
  y: number
}

export function nuevaPagina(pdfDoc: PDFDocument): PDFPage {
  return pdfDoc.addPage([ANCHO_PAGINA, ALTO_PAGINA])
}

export function crearCursor(pdfDoc: PDFDocument): Cursor {
  return { pagina: nuevaPagina(pdfDoc), y: ALTO_PAGINA - MARGEN }
}

// Corta un texto en líneas que entran en anchoMax, midiendo con la fuente
// real (no por cantidad de caracteres) — mismo criterio de medición que ya
// usa el pie de firma (fuente.widthOfTextAtSize) en generarPdf.ts.
export function partirLineas(texto: string, fuente: PDFFont, tamano: number, anchoMax: number): string[] {
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

export function saltarPaginaSiNoEntra(pdfDoc: PDFDocument, cursor: Cursor, alturaNecesaria: number) {
  if (cursor.y - alturaNecesaria < MARGEN_INFERIOR) {
    cursor.pagina = nuevaPagina(pdfDoc)
    cursor.y = ALTO_PAGINA - MARGEN
  }
}

export function espacio(cursor: Cursor, alto: number) {
  cursor.y -= alto
}

// Una línea simple (sin wrap: encabezados cortos tipo "CHAO, ..." o
// "PRESENTE. -"), con su propio salto de página si no entra.
export function linea(pdfDoc: PDFDocument, cursor: Cursor, texto: string, fuente: PDFFont, tamano: number, alturaLinea: number, x = MARGEN) {
  saltarPaginaSiNoEntra(pdfDoc, cursor, alturaLinea)
  cursor.pagina.drawText(texto, { x, y: cursor.y, size: tamano, font: fuente, color: rgb(0, 0, 0) })
  cursor.y -= alturaLinea
}

// Párrafo con salto de línea automático al ancho útil de la página.
export function parrafo(pdfDoc: PDFDocument, cursor: Cursor, texto: string, fuente: PDFFont, tamano: number, alturaLinea: number) {
  for (const l of partirLineas(texto, fuente, tamano, ANCHO_UTIL)) {
    linea(pdfDoc, cursor, l, fuente, tamano, alturaLinea)
  }
}

// Lista numerada "1. texto..." con sangría colgante: si un ítem se parte en
// varias líneas, las de continuación quedan alineadas bajo el texto, no
// bajo el número.
export function listaNumerada(pdfDoc: PDFDocument, cursor: Cursor, items: string[], fuente: PDFFont, tamano: number, alturaLinea = ALTURA_LINEA) {
  items.forEach((item, i) => {
    const prefijo = `${i + 1}. `
    const sangria = fuente.widthOfTextAtSize(prefijo, tamano)
    const lineas = partirLineas(item, fuente, tamano, ANCHO_UTIL - sangria)
    lineas.forEach((l, j) => {
      saltarPaginaSiNoEntra(pdfDoc, cursor, alturaLinea)
      const x = MARGEN + (j === 0 ? 0 : sangria)
      cursor.pagina.drawText(j === 0 ? `${prefijo}${l}` : l, { x, y: cursor.y, size: tamano, font: fuente, color: rgb(0, 0, 0) })
      cursor.y -= alturaLinea
    })
  })
}
