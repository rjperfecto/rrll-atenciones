import { Document, Packer, Paragraph, Table } from 'docx'
import { fechaCorta } from './fechaLarga'
import type { FirmaParaPdf } from './generarPdf'
import { encabezadoDocx, parrafoTexto, tituloParrafo, itemLista, tablaFirmasDocx } from './cartaDocxComun'
import { SIN_COMPROMISO } from '@/data/formulario360'
import { CAMPOS_CARTA_COMPROMISOS, aplicarPlaceholders } from '@/data/textosCartas360'
import type { DatosCartaCompromisos360 } from './cartaCompromisos360'

// Versión en Word de generarCartaCompromisos360 (ver ese archivo): mismo
// contenido, orden y textos personalizables, pero con fuentes estándar de
// Word (no se embebe PT Sans Narrow) y sin el armado punto a punto de
// pdf-lib — alcanza con párrafos y una tabla simple. Pensada para que RRLL
// pueda editar el documento final a mano en Word si lo necesita.

function lineaCompromiso(texto: string, fechaVerificacion: string): string {
  if (!texto || texto === SIN_COMPROMISO) return SIN_COMPROMISO
  return fechaVerificacion ? `${texto} — Fecha de verificación: ${fechaCorta(fechaVerificacion)}` : texto
}

function resolverCampo(id: string, overrides: Record<string, string>): string {
  return overrides[id] ?? CAMPOS_CARTA_COMPROMISOS.find((c) => c.id === id)?.defaultTexto ?? ''
}

export async function generarCartaCompromisos360Docx(
  datos: DatosCartaCompromisos360,
  firmaLider: FirmaParaPdf,
  firmaSupervisor: FirmaParaPdf | null,
  textosPersonalizados: Record<string, string> = {},
): Promise<Uint8Array> {
  const t = (id: string) => resolverCampo(id, textosPersonalizados)

  const children: (Paragraph | Table)[] = []
  children.push(...(await encabezadoDocx({ fecha: datos.fecha, nombre: firmaLider.nombre, dni: firmaLider.dni ?? '' })))

  children.push(
    parrafoTexto(
      aplicarPlaceholders(t('intro'), { fecha: fechaCorta(datos.fecha), grupo: datos.grupo, fundo: datos.fundo, liderCosecha: datos.liderCosecha }),
      { after: 240 },
    ),
  )

  children.push(tituloParrafo(t('tituloAlertas')))
  children.push(parrafoTexto(t('introAlertas'), { after: 80 }))
  datos.alertas.forEach((a, i) => children.push(itemLista(i + 1, `${a.categoria} - ${a.subcategoria}: ${a.detalle}`)))

  children.push(tituloParrafo(t('tituloCompromisosLider')))
  children.push(parrafoTexto(t('introCompromisosLider'), { after: 80 }))
  datos.alertas.forEach((a, i) => children.push(itemLista(i + 1, lineaCompromiso(a.accion, a.fecha_verificacion))))

  children.push(tituloParrafo(t('tituloCompromisosRrll')))
  datos.alertas.forEach((a, i) => children.push(itemLista(i + 1, lineaCompromiso(a.accion_rrll, a.fecha_verificacion_rrll))))

  children.push(parrafoTexto(t('cierre1')))
  children.push(parrafoTexto(t('cierre2'), { after: 240 }))

  children.push(parrafoTexto('Atentamente,', { after: 240 }))
  children.push(tablaFirmasDocx(firmaLider, firmaSupervisor, datos.supervisorNombre))

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
