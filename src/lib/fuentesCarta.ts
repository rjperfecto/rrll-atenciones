import fontkit from '@pdf-lib/fontkit'
import type { PDFDocument, PDFFont } from 'pdf-lib'
import fuenteRegularUrl from '@/assets/fonts/PTSansNarrow-Regular.ttf'
import fuenteNegritaUrl from '@/assets/fonts/PTSansNarrow-Bold.ttf'

// Fuente pedida para las cartas de 360 Laboral: Arial Narrow. Arial Narrow es
// una fuente de Microsoft sin licencia para redistribuirse embebida en los
// PDF que genera la app (mismo motivo por el que generarPdf.ts ya usa
// Helvetica en vez de Arial, ver comentario ahí) — se usa en su lugar PT Sans
// Narrow (SIL Open Font License, libre para incrustar), métrica y visualmente
// equivalente: angosta, de palo seco, misma familia de uso que Arial Narrow.
let bytesRegularCache: ArrayBuffer | null = null
let bytesNegritaCache: ArrayBuffer | null = null

export interface FuentesCarta {
  regular: PDFFont
  negrita: PDFFont
}

export async function embeberFuentesCarta(pdfDoc: PDFDocument): Promise<FuentesCarta> {
  pdfDoc.registerFontkit(fontkit)
  if (!bytesRegularCache) bytesRegularCache = await (await fetch(fuenteRegularUrl)).arrayBuffer()
  if (!bytesNegritaCache) bytesNegritaCache = await (await fetch(fuenteNegritaUrl)).arrayBuffer()
  const regular = await pdfDoc.embedFont(bytesRegularCache, { subset: true })
  const negrita = await pdfDoc.embedFont(bytesNegritaCache, { subset: true })
  return { regular, negrita }
}
