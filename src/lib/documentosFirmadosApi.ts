import { supabase } from './supabaseClient'

const BUCKET = 'documentos-firmados'

// Un documento firmado por caso (ver migración 0039): el nombre del archivo
// es el id de la atención, así que subir uno nuevo reemplaza al anterior si
// alguna vez se vuelve a firmar.
export async function subirDocumentoFirmado(atencionId: string, bytes: Uint8Array): Promise<{ path: string | null; error: string | null }> {
  const path = `${atencionId}.pdf`
  // pdf-lib tipa su Uint8Array como ArrayBufferLike: se copia a uno con
  // ArrayBuffer normal, mismo motivo que descargarPdf en generarPdf.ts.
  const copia = new Uint8Array(bytes.length)
  copia.set(bytes)
  const { error } = await supabase.storage.from(BUCKET).upload(path, copia, { contentType: 'application/pdf', upsert: true })
  if (error) return { path: null, error: error.message }
  return { path, error: null }
}

export async function descargarDocumentoFirmado(path: string): Promise<{ bytes: ArrayBuffer | null; error: string | null }> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path)
  if (error || !data) return { bytes: null, error: error?.message ?? 'No se pudo descargar el archivo.' }
  return { bytes: await data.arrayBuffer(), error: null }
}
