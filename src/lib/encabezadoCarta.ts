import { rgb } from 'pdf-lib'
import type { PDFDocument, PDFFont } from 'pdf-lib'
import logoUrl from '@/assets/hortifrutLogo.png'
import { fechaLarga } from './fechaLarga'
import { MARGEN, ANCHO_PAGINA, TAMANO_BASE, ALTURA_LINEA, saltarPaginaSiNoEntra, espacio, linea, type Cursor } from './pdfComposer'

// Encabezado fijo de toda carta generada (Carta de compromisos, Carta de
// verificación): fecha arriba a la derecha, logo de Hortifrut Perú centrado
// debajo, datos del destinatario y "Presente. -" / "De nuestra
// consideración:" — mismo formato en los dos documentos, por eso vive acá y
// no en cada uno.

// El logo no cambia entre cartas: se pide una sola vez por sesión, no en
// cada PDF que se genera.
let bytesLogoCache: Uint8Array | null = null
async function obtenerBytesLogo(): Promise<Uint8Array> {
  if (!bytesLogoCache) {
    const respuesta = await fetch(logoUrl)
    bytesLogoCache = new Uint8Array(await respuesta.arrayBuffer())
  }
  return bytesLogoCache
}

export interface DatosEncabezadoCarta {
  fecha: string // YYYY-MM-DD
  nombre: string
  dni: string
}

export async function dibujarEncabezadoCarta(
  pdfDoc: PDFDocument,
  cursor: Cursor,
  fuente: PDFFont,
  fuenteNegrita: PDFFont,
  datos: DatosEncabezadoCarta,
): Promise<void> {
  // "Chao, 26 de octubre de 2026" (no todo en mayúscula, a diferencia del
  // dato "fecha" de las Plantillas PDF — ver textoFecha en plantillaTextos.ts,
  // que sigue en mayúscula para esos documentos), alineada arriba a la derecha.
  const textoChao = `Chao, ${fechaLarga(datos.fecha)}`
  const anchoChao = fuenteNegrita.widthOfTextAtSize(textoChao, TAMANO_BASE)
  cursor.pagina.drawText(textoChao, {
    x: ANCHO_PAGINA - MARGEN - anchoChao,
    y: cursor.y,
    size: TAMANO_BASE,
    font: fuenteNegrita,
    color: rgb(0, 0, 0),
  })
  cursor.y -= ALTURA_LINEA
  espacio(cursor, 10)

  // Logo centrado horizontalmente en la página.
  const imagenLogo = await pdfDoc.embedPng(await obtenerBytesLogo())
  const anchoLogo = 72
  const altoLogo = anchoLogo * (imagenLogo.height / imagenLogo.width)
  const yLogo = cursor.y - altoLogo
  cursor.pagina.drawImage(imagenLogo, { x: (ANCHO_PAGINA - anchoLogo) / 2, y: yLogo, width: anchoLogo, height: altoLogo })
  cursor.y = yLogo - 18

  linea(pdfDoc, cursor, `Señor(a): ${datos.nombre}`, fuenteNegrita, TAMANO_BASE, ALTURA_LINEA)
  linea(pdfDoc, cursor, `DNI: ${datos.dni}`, fuenteNegrita, TAMANO_BASE, ALTURA_LINEA)
  espacio(cursor, 14)

  // "Presente" subrayado (pdf-lib no tiene texto subrayado nativo: se dibuja
  // una línea fina debajo, del ancho exacto de esa palabra).
  const textoPresente = 'Presente'
  const anchoPresente = fuente.widthOfTextAtSize(textoPresente, TAMANO_BASE)
  saltarPaginaSiNoEntra(pdfDoc, cursor, ALTURA_LINEA)
  cursor.pagina.drawText('Presente. -', { x: MARGEN, y: cursor.y, size: TAMANO_BASE, font: fuente, color: rgb(0, 0, 0) })
  cursor.pagina.drawLine({
    start: { x: MARGEN, y: cursor.y - 1.5 },
    end: { x: MARGEN + anchoPresente, y: cursor.y - 1.5 },
    thickness: 0.6,
    color: rgb(0, 0, 0),
  })
  cursor.y -= ALTURA_LINEA
  espacio(cursor, 14)

  linea(pdfDoc, cursor, 'De nuestra consideración:', fuente, TAMANO_BASE, ALTURA_LINEA)
  espacio(cursor, 14)
}
