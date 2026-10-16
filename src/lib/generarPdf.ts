import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { zipSync } from 'fflate'
import { INTERLINEADO_PLANTILLA } from './plantillaTextos'
import type { CampoPlantilla, PosicionCampoPlantilla } from '@/types'

export async function generarPdfConDatos(
  bytesPlantilla: ArrayBuffer,
  posiciones: PosicionCampoPlantilla[],
  valores: Record<CampoPlantilla, string>,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(bytesPlantilla)
  // Arial Negrita pedido: Arial no es una de las 14 fuentes estándar de PDF
  // embebibles sin licencia, así que se usa Helvetica-Bold (métricamente
  // igual a Arial Bold, es la sustitución estándar de la industria).
  const fuente = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const paginas = pdfDoc.getPages()
  for (const pos of posiciones) {
    const pagina = paginas[pos.pagina - 1]
    const texto = valores[pos.campo]
    if (!pagina || !texto) continue
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
