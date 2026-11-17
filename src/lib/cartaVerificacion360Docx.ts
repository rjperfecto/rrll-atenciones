import { Document, Packer, Paragraph, Table, TextRun } from 'docx'
import { fechaCorta } from './fechaLarga'
import type { FirmaParaPdf } from './generarPdf'
import { encabezadoDocx, parrafoTexto, tituloParrafo, tablaFirmasDocx, TAMANO_BASE_DOCX } from './cartaDocxComun'
import { ETIQUETA_ESTADO_VERIFICACION, type EstadoVerificacionCompromiso } from '@/data/formulario360'
import { CAMPOS_CARTA_VERIFICACION, aplicarPlaceholders } from '@/data/textosCartas360'
import type { DatosCartaVerificacion360 } from './cartaVerificacion360'

// Versión en Word de generarCartaVerificacion360 (ver ese archivo): mismo
// contenido, orden y textos personalizables, pero con fuentes estándar de
// Word en vez de la fuente embebida del PDF. Ver comentario de
// cartaCompromisos360Docx.ts (misma idea, acá con dos firmas en vez de una).

function resolverCampo(id: string, overrides: Record<string, string>): string {
  return overrides[id] ?? CAMPOS_CARTA_VERIFICACION.find((c) => c.id === id)?.defaultTexto ?? ''
}

function parrafosVerificacion(items: { texto: string; estado: EstadoVerificacionCompromiso; detalle: string }[]): Paragraph[] {
  const out: Paragraph[] = []
  items.forEach((item) => {
    out.push(new Paragraph({ children: [new TextRun({ text: `• ${item.texto}`, size: TAMANO_BASE_DOCX })], spacing: { after: 40 } }))
    const textoEstado = `Estado: ${ETIQUETA_ESTADO_VERIFICACION[item.estado]}${item.detalle ? ` — Detalle: ${item.detalle}` : ''}`
    out.push(new Paragraph({ children: [new TextRun({ text: textoEstado, bold: true, size: TAMANO_BASE_DOCX })], indent: { left: 360 }, spacing: { after: 120 } }))
  })
  return out
}

export async function generarCartaVerificacion360Docx(
  datos: DatosCartaVerificacion360,
  firmaSupervisor: FirmaParaPdf | null,
  firmaTrabajador: FirmaParaPdf,
  textosPersonalizados: Record<string, string> = {},
): Promise<Uint8Array> {
  const t = (id: string) => resolverCampo(id, textosPersonalizados)

  const children: (Paragraph | Table)[] = []
  children.push(...(await encabezadoDocx({ fecha: datos.fechaRecepcion, nombre: firmaTrabajador.nombre, dni: firmaTrabajador.dni ?? '' })))

  children.push(
    parrafoTexto(
      aplicarPlaceholders(t('intro'), {
        fechaCartaAnterior: fechaCorta(datos.fechaCartaAnterior),
        fechaVisita: fechaCorta(datos.fechaVisita),
        grupo: datos.grupo,
        fundo: datos.fundo,
        liderCosecha: datos.liderCosecha,
      }),
      { after: 240 },
    ),
  )

  children.push(tituloParrafo(t('tituloResultado')))
  children.push(parrafoTexto(t('introResultado'), { after: 120 }))

  const compromisosLider = datos.alertas
    .filter((a) => a.verificacion_lider)
    .map((a) => ({ texto: a.accion, estado: a.verificacion_lider as EstadoVerificacionCompromiso, detalle: a.verificacion_lider_detalle ?? '' }))
  if (compromisosLider.length > 0) {
    children.push(parrafoTexto(t('tituloCompromisosLider'), { bold: true, after: 80 }))
    children.push(...parrafosVerificacion(compromisosLider))
  }

  const compromisosRrll = datos.alertas
    .filter((a) => a.verificacion_rrll)
    .map((a) => ({ texto: a.accion_rrll, estado: a.verificacion_rrll as EstadoVerificacionCompromiso, detalle: a.verificacion_rrll_detalle ?? '' }))
  if (compromisosRrll.length > 0) {
    children.push(parrafoTexto(t('tituloCompromisosRrll'), { bold: true, after: 80 }))
    children.push(...parrafosVerificacion(compromisosRrll))
  }

  children.push(parrafoTexto(t('tituloObservaciones'), { bold: true, after: 80 }))
  children.push(parrafoTexto(datos.observaciones || 'Ninguna.', { after: 240 }))

  children.push(tituloParrafo(t('tituloResultadoGeneral')))
  children.push(
    parrafoTexto(
      datos.resultado === 'CIERRE_EFECTIVO'
        ? t('resultadoCierreEfectivo')
        : aplicarPlaceholders(t('resultadoSeguimientoAdicional'), { nuevaFechaVerificacion: fechaCorta(datos.nuevaFechaVerificacion ?? '') }),
      { after: 240 },
    ),
  )

  children.push(parrafoTexto(t('cierre'), { after: 240 }))

  children.push(parrafoTexto('Atentamente,', { after: 240 }))
  children.push(tablaFirmasDocx(firmaTrabajador, firmaSupervisor, datos.supervisorNombre))
  children.push(parrafoTexto(`Fecha de recepción: ${fechaCorta(datos.fechaRecepcion)}`, { after: 0 }))

  const doc = new Document({
    sections: [
      {
        properties: { page: { size: { width: '21cm', height: '29.7cm' }, margin: { top: '2cm', right: '2cm', bottom: '2.3cm', left: '2cm' } } },
        children,
      },
    ],
  })
  const blob = await Packer.toBlob(doc)
  return new Uint8Array(await blob.arrayBuffer())
}
