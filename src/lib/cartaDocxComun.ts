import { AlignmentType, BorderStyle, ImageRun, Paragraph, Table, TableCell, TableRow, TextRun, UnderlineType, WidthType } from 'docx'
import { fechaLarga } from './fechaLarga'
import { obtenerBytesLogo } from './encabezadoCarta'
import type { FirmaParaPdf } from './generarPdf'

// Piezas compartidas entre las versiones en Word de las dos cartas de 360
// Laboral (cartaCompromisos360Docx.ts / cartaVerificacion360Docx.ts): mismo
// contenido y orden que las versiones en PDF (cartaCompromisos360.ts /
// cartaVerificacion360.ts / encabezadoCarta.ts / generarPdf.ts), pero con
// fuentes estándar de Word en vez de la fuente embebida, y con párrafos y
// una tabla simple en vez del armado punto a punto de pdf-lib — así RRLL
// puede editar el documento final a mano en Word si lo necesita.

export const TAMANO_BASE_DOCX = 21 // 10.5pt en half-points, igual a TAMANO_BASE del PDF (ver pdfComposer.ts)
export const TAMANO_TITULO_DOCX = 23 // 11.5pt, igual a TAMANO_TITULO

// Tamaño del logo en px a 96dpi (equivalente visual a los 72pt del PDF), con
// la proporción real del PNG (282x315, ver src/assets/hortifrutLogo.png).
const ANCHO_LOGO_DOCX = 96
const ALTO_LOGO_DOCX = Math.round(ANCHO_LOGO_DOCX * (315 / 282))

const ANCHO_TRAZO_FIRMA_DOCX = 140
const ALTO_TRAZO_FIRMA_DOCX = 50

const TEXTO_ORG = 'Relaciones Laborales — Hortifrut Perú S.A.C.'

export function parrafoTexto(texto: string, opts: { bold?: boolean; size?: number; after?: number } = {}): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: texto, bold: opts.bold, size: opts.size ?? TAMANO_BASE_DOCX })],
    spacing: { after: opts.after ?? 160 },
  })
}

export function tituloParrafo(texto: string): Paragraph {
  return parrafoTexto(texto, { bold: true, size: TAMANO_TITULO_DOCX, after: 80 })
}

// Lista numerada simple ("1. texto...", con sangría colgante si Word parte
// el ítem en varias líneas) — mismo criterio que listaNumerada en
// pdfComposer.ts.
export function itemLista(n: number, texto: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: `${n}. ${texto}`, size: TAMANO_BASE_DOCX })],
    spacing: { after: 80 },
    indent: { left: 360, hanging: 360 },
  })
}

export async function encabezadoDocx(datos: { fecha: string; nombre: string; dni: string }): Promise<Paragraph[]> {
  const logoBytes = await obtenerBytesLogo()
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [new ImageRun({ type: 'png', data: logoBytes, transformation: { width: ANCHO_LOGO_DOCX, height: ALTO_LOGO_DOCX } })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 240 },
      children: [new TextRun({ text: `Chao, ${fechaLarga(datos.fecha)}`, bold: true, size: TAMANO_BASE_DOCX })],
    }),
    parrafoTexto(`Señor(a): ${datos.nombre}`, { bold: true, after: 0 }),
    parrafoTexto(`DNI: ${datos.dni}`, { bold: true, after: 180 }),
    new Paragraph({
      spacing: { after: 180 },
      children: [
        new TextRun({ text: 'Presente', size: TAMANO_BASE_DOCX, underline: { type: UnderlineType.SINGLE } }),
        new TextRun({ text: '. -', size: TAMANO_BASE_DOCX }),
      ],
    }),
    parrafoTexto('De nuestra consideración:', { after: 240 }),
  ]
}

const SIN_BORDE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
const SIN_BORDES = { top: SIN_BORDE, bottom: SIN_BORDE, left: SIN_BORDE, right: SIN_BORDE, insideHorizontal: SIN_BORDE, insideVertical: SIN_BORDE }

function celdaFirmaConImagen(firma: FirmaParaPdf, lineaExtra: string): TableCell {
  return new TableCell({
    borders: SIN_BORDES,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [new ImageRun({ type: 'png', data: firma.png, transformation: { width: ANCHO_TRAZO_FIRMA_DOCX, height: ALTO_TRAZO_FIRMA_DOCX } })],
      }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 20 }, children: [new TextRun({ text: '_______________________', size: TAMANO_BASE_DOCX })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: firma.nombre.toUpperCase(), bold: true, size: TAMANO_BASE_DOCX })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: lineaExtra, size: TAMANO_BASE_DOCX })] }),
    ],
  })
}

function celdaFirmaSinImagen(nombre: string, lineaExtra: string): TableCell {
  return new TableCell({
    borders: SIN_BORDES,
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 20 }, children: [new TextRun({ text: '_______________________', size: TAMANO_BASE_DOCX })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: nombre.toUpperCase(), bold: true, size: TAMANO_BASE_DOCX })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: lineaExtra, size: TAMANO_BASE_DOCX })] }),
    ],
  })
}

// Firmas de cierre lado a lado (mismo criterio que dibujarBloqueFirma en
// generarPdf.ts): a la izquierda quien firma en vivo (líder o trabajador,
// con su DNI debajo), a la derecha el supervisor RRLL de la zona — con
// trazo guardado si tiene una firma cargada en Administración > Firmas de
// personal, o solo el nombre en texto si todavía no la tiene, y siempre la
// línea de la organización debajo (un usuario de la plataforma no tiene DNI
// guardado en el sistema).
export function tablaFirmasDocx(firmaIzquierda: FirmaParaPdf, firmaSupervisor: FirmaParaPdf | null, nombreSupervisor: string): Table {
  const celdaIzquierda = celdaFirmaConImagen(firmaIzquierda, firmaIzquierda.dni ? `DNI: ${firmaIzquierda.dni}` : '')
  const celdaDerecha = firmaSupervisor ? celdaFirmaConImagen(firmaSupervisor, TEXTO_ORG) : celdaFirmaSinImagen(nombreSupervisor, TEXTO_ORG)
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SIN_BORDES,
    rows: [new TableRow({ children: [celdaIzquierda, celdaDerecha] })],
  })
}
