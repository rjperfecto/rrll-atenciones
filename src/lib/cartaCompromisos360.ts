import { PDFDocument, rgb } from 'pdf-lib'
import { fechaCorta } from './fechaLarga'
import { dibujarBloqueFirma, type FirmaParaPdf } from './generarPdf'
import { dibujarEncabezadoCarta } from './encabezadoCarta'
import { embeberFuentesCarta } from './fuentesCarta'
import { ANCHO_PAGINA, MARGEN, TAMANO_BASE, TAMANO_TITULO, ALTURA_LINEA, ALTURA_LINEA_TITULO, crearCursor, saltarPaginaSiNoEntra, espacio, linea, parrafo, listaNumerada } from './pdfComposer'
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
  supervisorNombre: string // SUP. RRLL de la zona, ver supervisoresRrll.ts
  alertas: AlertaReportada360[]
}

function lineaCompromiso(texto: string, fechaVerificacion: string): string {
  if (!texto || texto === SIN_COMPROMISO) return SIN_COMPROMISO
  return fechaVerificacion ? `${texto} — Fecha de verificación: ${fechaCorta(fechaVerificacion)}` : texto
}

export async function generarCartaCompromisos360(
  datos: DatosCartaCompromisos360,
  firmaLider: FirmaParaPdf,
  // Firma guardada (Administración > Firmas de personal) del supervisor
  // RRLL de la zona — null si ese usuario todavía no tiene una guardada, en
  // cuyo caso se imprime solo el nombre.
  firmaSupervisor: FirmaParaPdf | null,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const { regular: fuente, negrita: fuenteNegrita } = await embeberFuentesCarta(pdfDoc)
  const imagenFirmaLider = await pdfDoc.embedPng(firmaLider.png)
  const imagenFirmaSupervisor = firmaSupervisor ? await pdfDoc.embedPng(firmaSupervisor.png) : null

  const cursor = crearCursor(pdfDoc)
  await dibujarEncabezadoCarta(pdfDoc, cursor, fuente, fuenteNegrita, { fecha: datos.fecha, nombre: firmaLider.nombre, dni: firmaLider.dni ?? '' })

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

  // Firmas de cierre, una al lado de la otra y a la misma altura: el líder
  // (firma en vivo) a la izquierda, el supervisor RRLL de la zona a la
  // derecha — con trazo guardado si tiene firma cargada en Administración >
  // Firmas de personal, o solo el nombre en texto si todavía no la tiene.
  linea(pdfDoc, cursor, 'Atentamente,', fuente, TAMANO_BASE, ALTURA_LINEA)
  espacio(cursor, 4)

  const ANCHO_FIRMA_LIDER = 180
  const ANCHO_FIRMA_SUP = 160
  const ALTO_TRAZO = 45
  const xFirmaSup = ANCHO_PAGINA - MARGEN - ANCHO_FIRMA_SUP
  saltarPaginaSiNoEntra(pdfDoc, cursor, ALTO_TRAZO + 40)
  const yLineaFirmas = cursor.y - ALTO_TRAZO
  dibujarBloqueFirma(cursor.pagina, fuenteNegrita, imagenFirmaLider, firmaLider, MARGEN, yLineaFirmas, ANCHO_FIRMA_LIDER, ALTO_TRAZO)
  if (imagenFirmaSupervisor && firmaSupervisor) {
    dibujarBloqueFirma(cursor.pagina, fuenteNegrita, imagenFirmaSupervisor, firmaSupervisor, xFirmaSup, yLineaFirmas, ANCHO_FIRMA_SUP, ALTO_TRAZO)
  } else {
    const textoNombre = datos.supervisorNombre.toUpperCase()
    const textoOrg = 'Relaciones Laborales — Hortifrut Perú S.A.C.'
    const anchoNombre = fuenteNegrita.widthOfTextAtSize(textoNombre, TAMANO_BASE)
    const anchoOrg = fuente.widthOfTextAtSize(textoOrg, TAMANO_BASE)
    const yTexto = yLineaFirmas + ALTO_TRAZO / 2
    cursor.pagina.drawText(textoNombre, { x: ANCHO_PAGINA - MARGEN - anchoNombre, y: yTexto, size: TAMANO_BASE, font: fuenteNegrita, color: rgb(0, 0, 0) })
    cursor.pagina.drawText(textoOrg, { x: ANCHO_PAGINA - MARGEN - anchoOrg, y: yTexto - ALTURA_LINEA, size: TAMANO_BASE, font: fuente, color: rgb(0, 0, 0) })
  }
  cursor.y = yLineaFirmas - 24

  return pdfDoc.save()
}
