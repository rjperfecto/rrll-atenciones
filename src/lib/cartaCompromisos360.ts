import { PDFDocument, rgb } from 'pdf-lib'
import { fechaCorta } from './fechaLarga'
import { dibujarBloqueFirma, type FirmaParaPdf } from './generarPdf'
import { dibujarEncabezadoCarta } from './encabezadoCarta'
import { embeberFuentesCarta } from './fuentesCarta'
import { ANCHO_PAGINA, MARGEN, TAMANO_BASE, TAMANO_TITULO, ALTURA_LINEA, ALTURA_LINEA_TITULO, crearCursor, saltarPaginaSiNoEntra, espacio, linea, parrafo, listaNumerada } from './pdfComposer'
import { SIN_COMPROMISO } from '@/data/formulario360'
import { CAMPOS_CARTA_COMPROMISOS, aplicarPlaceholders } from '@/data/textosCartas360'
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

function resolverCampo(id: string, overrides: Record<string, string>): string {
  return overrides[id] ?? CAMPOS_CARTA_COMPROMISOS.find((c) => c.id === id)?.defaultTexto ?? ''
}

export async function generarCartaCompromisos360(
  datos: DatosCartaCompromisos360,
  firmaLider: FirmaParaPdf,
  // Firma guardada (Administración > Firmas de personal) del supervisor
  // RRLL de la zona — null si ese usuario todavía no tiene una guardada, en
  // cuyo caso se imprime solo el nombre.
  firmaSupervisor: FirmaParaPdf | null,
  // Textos personalizados desde Administración > Textos de cartas 360 (ver
  // textosCartasApi.ts) — un campo sin override acá usa el texto por
  // defecto de CAMPOS_CARTA_COMPROMISOS.
  textosPersonalizados: Record<string, string> = {},
): Promise<Uint8Array> {
  const t = (id: string) => resolverCampo(id, textosPersonalizados)
  const pdfDoc = await PDFDocument.create()
  const { regular: fuente, negrita: fuenteNegrita } = await embeberFuentesCarta(pdfDoc)
  const imagenFirmaLider = await pdfDoc.embedPng(firmaLider.png)
  const imagenFirmaSupervisor = firmaSupervisor ? await pdfDoc.embedPng(firmaSupervisor.png) : null

  const cursor = crearCursor(pdfDoc)
  await dibujarEncabezadoCarta(pdfDoc, cursor, fuente, fuenteNegrita, { fecha: datos.fecha, nombre: firmaLider.nombre, dni: firmaLider.dni ?? '' })

  parrafo(
    pdfDoc,
    cursor,
    aplicarPlaceholders(t('intro'), {
      fecha: fechaCorta(datos.fecha),
      grupo: datos.grupo,
      fundo: datos.fundo,
      liderCosecha: datos.liderCosecha,
    }),
    fuente,
    TAMANO_BASE,
    ALTURA_LINEA,
  )
  espacio(cursor, 14)

  linea(pdfDoc, cursor, t('tituloAlertas'), fuenteNegrita, TAMANO_TITULO, ALTURA_LINEA_TITULO)
  espacio(cursor, 2)
  parrafo(pdfDoc, cursor, t('introAlertas'), fuente, TAMANO_BASE, ALTURA_LINEA)
  espacio(cursor, 4)
  listaNumerada(
    pdfDoc,
    cursor,
    datos.alertas.map((a) => `${a.categoria} - ${a.subcategoria}: ${a.detalle}`),
    fuente,
    TAMANO_BASE,
  )
  espacio(cursor, 14)

  linea(pdfDoc, cursor, t('tituloCompromisosLider'), fuenteNegrita, TAMANO_TITULO, ALTURA_LINEA_TITULO)
  espacio(cursor, 2)
  parrafo(pdfDoc, cursor, t('introCompromisosLider'), fuente, TAMANO_BASE, ALTURA_LINEA)
  espacio(cursor, 4)
  listaNumerada(
    pdfDoc,
    cursor,
    datos.alertas.map((a) => lineaCompromiso(a.accion, a.fecha_verificacion)),
    fuente,
    TAMANO_BASE,
  )
  espacio(cursor, 14)

  linea(pdfDoc, cursor, t('tituloCompromisosRrll'), fuenteNegrita, TAMANO_TITULO, ALTURA_LINEA_TITULO)
  espacio(cursor, 4)
  listaNumerada(
    pdfDoc,
    cursor,
    datos.alertas.map((a) => lineaCompromiso(a.accion_rrll, a.fecha_verificacion_rrll)),
    fuente,
    TAMANO_BASE,
  )
  espacio(cursor, 14)

  parrafo(pdfDoc, cursor, t('cierre1'), fuente, TAMANO_BASE, ALTURA_LINEA)
  espacio(cursor, 8)
  parrafo(pdfDoc, cursor, t('cierre2'), fuente, TAMANO_BASE, ALTURA_LINEA)
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
  // Mismo tamaño de letra en las dos firmas de cierre, tenga o no imagen la
  // del supervisor (ver dibujarBloqueFirma en generarPdf.ts): el de por
  // defecto (pensado para el recuadro chico de una Plantilla PDF) se ve
  // muy chico acá, donde no hay ese límite de espacio.
  const TAMANO_PIE_CARTA = TAMANO_BASE
  const INTERLINEA_PIE_CARTA = 13
  const xFirmaSup = ANCHO_PAGINA - MARGEN - ANCHO_FIRMA_SUP
  saltarPaginaSiNoEntra(pdfDoc, cursor, ALTO_TRAZO + 50)
  const yLineaFirmas = cursor.y - ALTO_TRAZO
  dibujarBloqueFirma(
    cursor.pagina,
    fuenteNegrita,
    imagenFirmaLider,
    firmaLider,
    MARGEN,
    yLineaFirmas,
    ANCHO_FIRMA_LIDER,
    ALTO_TRAZO,
    TAMANO_PIE_CARTA,
    INTERLINEA_PIE_CARTA,
  )
  // "Relaciones Laborales — Hortifrut Perú S.A.C." debajo del nombre del
  // supervisor, con o sin firma guardada (antes solo salía en el caso sin
  // firma) — mismo lugar que ocuparía el DNI en el bloque del líder, que acá
  // queda libre porque un usuario de la plataforma no tiene DNI guardado.
  const textoOrg = 'Relaciones Laborales — Hortifrut Perú S.A.C.'
  const anchoOrg = fuente.widthOfTextAtSize(textoOrg, TAMANO_PIE_CARTA)
  const dibujarOrg = () =>
    cursor.pagina.drawText(textoOrg, {
      x: xFirmaSup + (ANCHO_FIRMA_SUP - anchoOrg) / 2,
      y: yLineaFirmas - INTERLINEA_PIE_CARTA * 2,
      size: TAMANO_PIE_CARTA,
      font: fuente,
      color: rgb(0, 0, 0),
    })
  if (imagenFirmaSupervisor && firmaSupervisor) {
    dibujarBloqueFirma(
      cursor.pagina,
      fuenteNegrita,
      imagenFirmaSupervisor,
      firmaSupervisor,
      xFirmaSup,
      yLineaFirmas,
      ANCHO_FIRMA_SUP,
      ALTO_TRAZO,
      TAMANO_PIE_CARTA,
      INTERLINEA_PIE_CARTA,
    )
    dibujarOrg()
  } else {
    // Sin firma guardada: mismo formato y tamaño de letra que el pie de la
    // firma de al lado (centrado bajo la columna, nombre en negrita y
    // debajo el área), solo que sin trazo ni línea porque no hay imagen.
    const textoNombre = datos.supervisorNombre.toUpperCase()
    const anchoNombre = fuenteNegrita.widthOfTextAtSize(textoNombre, TAMANO_PIE_CARTA)
    cursor.pagina.drawText(textoNombre, {
      x: xFirmaSup + (ANCHO_FIRMA_SUP - anchoNombre) / 2,
      y: yLineaFirmas - INTERLINEA_PIE_CARTA,
      size: TAMANO_PIE_CARTA,
      font: fuenteNegrita,
      color: rgb(0, 0, 0),
    })
    dibujarOrg()
  }
  cursor.y = yLineaFirmas - INTERLINEA_PIE_CARTA * 2 - 14

  return pdfDoc.save()
}
