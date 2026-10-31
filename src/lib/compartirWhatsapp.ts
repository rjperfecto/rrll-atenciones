import { MENSAJE_WHATSAPP_DOCUMENTO_FIRMADO, nombreArchivoFirmado } from './plantillaTextos'

// Compartir el documento firmado directo al selector nativo del celular
// (el usuario elige WhatsApp y el contacto ahí): no hay forma de adjuntar
// un archivo Y preseleccionar el contacto a la vez desde la web sin la API
// de WhatsApp Business (cuenta aprobada por Meta + backend propio). Usado
// tanto al firmar (RegistrarCaminata) como desde el detalle del caso
// (DetalleAtencionModal, para reenviarlo después).
export async function compartirDocumentoFirmado(bytes: Uint8Array, nombreLider: string | null): Promise<void> {
  const copia = new Uint8Array(bytes.length)
  copia.set(bytes)
  const archivo = new File([copia], nombreArchivoFirmado(nombreLider), { type: 'application/pdf' })
  if (!navigator.canShare?.({ files: [archivo] })) {
    throw new Error('Tu navegador no admite compartir archivos (disponible desde el celular).')
  }
  // Varias apps (WhatsApp incluida, según versión/OS) ignoran el "text" del
  // share cuando también se manda un archivo — limitación del share nativo
  // de Android/iOS, no de esta app. Se copia el mensaje al portapapeles como
  // respaldo para pegarlo a mano si no aparece solo.
  try {
    await navigator.clipboard.writeText(MENSAJE_WHATSAPP_DOCUMENTO_FIRMADO)
  } catch {
    // Sin permiso o sin soporte: no bloquea el compartir, solo no hay respaldo.
  }
  await navigator.share({ files: [archivo], text: MENSAJE_WHATSAPP_DOCUMENTO_FIRMADO })
}
