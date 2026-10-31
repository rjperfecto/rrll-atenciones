import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { zipSync } from 'fflate'
import { INTERLINEADO_PLANTILLA } from './plantillaTextos'
import type { CampoPlantilla, PosicionCampoPlantilla } from '@/types'

const ANCHO_FIRMA_DEFAULT = 150
const ALTO_FIRMA_DEFAULT = 60

// Debajo del trazo siempre va una línea con el nombre y DNI del firmante
// (como una firma de papel) — esta franja se reserva dentro del mismo
// recuadro que se posicionó en el editor (ver PosicionadorPlantilla), para
// no depender de que haya espacio libre debajo en la plantilla.
const ALTO_PIE_FIRMA = 26
const TAMANO_PIE_FIRMA = 7.5
const INTERLINEA_PIE_FIRMA = 9.5

export interface FirmaParaPdf {
  png: Uint8Array
  nombre: string
  dni: string
}

export async function generarPdfConDatos(
  bytesPlantilla: ArrayBuffer,
  posiciones: PosicionCampoPlantilla[],
  // "firma" no entra acá (no es texto): va aparte en el parámetro firma.
  valores: Partial<Record<Exclude<CampoPlantilla, 'firma'>, string>>,
  firma?: FirmaParaPdf | null,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(bytesPlantilla)
  // Arial Negrita pedido: Arial no es una de las 14 fuentes estándar de PDF
  // embebibles sin licencia, así que se usa Helvetica-Bold (métricamente
  // igual a Arial Bold, es la sustitución estándar de la industria).
  const fuente = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  // Se embebe una sola vez (no en cada posición) aunque la plantilla tenga
  // más de un campo "firma" — no debería pasar, pero no hace falta repetirlo.
  const imagenFirma = firma ? await pdfDoc.embedPng(firma.png) : null
  const paginas = pdfDoc.getPages()
  for (const pos of posiciones) {
    const pagina = paginas[pos.pagina - 1]
    if (!pagina) continue
    if (pos.campo === 'firma') {
      if (!imagenFirma || !firma) continue
      const ancho = pos.ancho ?? ANCHO_FIRMA_DEFAULT
      const alto = pos.alto ?? ALTO_FIRMA_DEFAULT
      const altoPie = Math.min(ALTO_PIE_FIRMA, alto - 10)
      const yLinea = pos.y + altoPie
      const altoDisponibleTrazo = alto - altoPie
      // El trazo mantiene su proporción (no se estira): se escala para
      // entrar en el ancho/alto disponible y se apoya justo sobre la línea,
      // como una firma real.
      const escala = Math.min(ancho / imagenFirma.width, altoDisponibleTrazo / imagenFirma.height)
      const anchoTrazo = imagenFirma.width * escala
      const altoTrazo = imagenFirma.height * escala
      pagina.drawImage(imagenFirma, {
        x: pos.x + (ancho - anchoTrazo) / 2,
        y: yLinea,
        width: anchoTrazo,
        height: altoTrazo,
      })
      pagina.drawLine({
        start: { x: pos.x, y: yLinea },
        end: { x: pos.x + ancho, y: yLinea },
        thickness: 0.75,
        color: rgb(0, 0, 0),
      })
      const centrado = (texto: string, y: number) => {
        const anchoTexto = fuente.widthOfTextAtSize(texto, TAMANO_PIE_FIRMA)
        pagina.drawText(texto, { x: pos.x + (ancho - anchoTexto) / 2, y, size: TAMANO_PIE_FIRMA, font: fuente, color: rgb(0, 0, 0) })
      }
      centrado(firma.nombre.toUpperCase(), yLinea - INTERLINEA_PIE_FIRMA)
      centrado(`DNI: ${firma.dni}`, yLinea - INTERLINEA_PIE_FIRMA * 2)
      continue
    }
    const texto = valores[pos.campo]
    if (!texto) continue
    // lineHeight: por si el texto trae "\n" (ej. "datos", 3 líneas); en un
    // texto de una sola línea (ej. "fecha") pdf-lib simplemente lo ignora.
    pagina.drawText(texto, {
      x: pos.x,
      y: pos.y,
      size: pos.tamano,
      font: fuente,
      lineHeight: pos.tamano * INTERLINEADO_PLANTILLA,
      color: rgb(0, 0, 0),
    })
  }
  return pdfDoc.save()
}

function descargarArchivo(bytes: Uint8Array, nombreArchivo: string, tipoMime: string) {
  // pdf-lib (y fflate) tipan su Uint8Array como ArrayBufferLike (admite
  // SharedArrayBuffer), que TS no deja pasar directo a BlobPart: se copia a
  // un Uint8Array con ArrayBuffer normal, que sí cumple el tipo.
  const copia = new Uint8Array(bytes.length)
  copia.set(bytes)
  const blob = new Blob([copia], { type: tipoMime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  a.click()
  URL.revokeObjectURL(url)
}

export function descargarPdf(bytes: Uint8Array, nombreArchivo: string) {
  descargarArchivo(bytes, nombreArchivo, 'application/pdf')
}

// Documento masivo: un PDF por trabajador, pero una sola descarga — se
// empaquetan todos en un .zip en vez de disparar N descargas sueltas (varios
// navegadores bloquean o advierten ante muchas descargas automáticas
// seguidas).
export function descargarZip(archivos: Record<string, Uint8Array>, nombreArchivo: string) {
  const zip = zipSync(archivos, { level: 0 })
  descargarArchivo(zip, nombreArchivo, 'application/zip')
}
