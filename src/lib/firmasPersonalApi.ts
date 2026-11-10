import { supabase } from './supabaseClient'

const BUCKET = 'firmas-personal'

export interface FirmaPersonal {
  usuario_id: string
  storage_path: string
  creado_por: string
  creado_por_nombre: string
  created_at: string
  updated_at: string
}

// Firma de un USUARIO de la plataforma (profiles), no de un trabajador de
// TAREO — se usa para firmar con la firma del propio responsable los
// documentos que genera en Herramientas > Documento (ver migración 0042).
export async function obtenerFirmaPersonal(usuarioId: string): Promise<FirmaPersonal | null> {
  const { data, error } = await supabase.from('firmas_personal').select('*').eq('usuario_id', usuarioId).maybeSingle()
  if (error || !data) return null
  return data as FirmaPersonal
}

// path fijo por usuario (upsert: true) = volver a subir para el mismo
// usuario reemplaza la firma anterior, igual que subirDocumentoFirmado.
export async function subirFirmaPersonal(
  usuarioId: string,
  pngBytes: Uint8Array,
  creadoPor: string,
  creadoPorNombre: string,
): Promise<{ error: string | null }> {
  const path = `${usuarioId}.png`
  const copia = new Uint8Array(pngBytes.length)
  copia.set(pngBytes)
  const { error: errorSubida } = await supabase.storage.from(BUCKET).upload(path, copia, { contentType: 'image/png', upsert: true })
  if (errorSubida) return { error: errorSubida.message }

  const { error } = await supabase.from('firmas_personal').upsert({
    usuario_id: usuarioId,
    storage_path: path,
    creado_por: creadoPor,
    creado_por_nombre: creadoPorNombre.toUpperCase(),
    updated_at: new Date().toISOString(),
  })
  return { error: error?.message ?? null }
}

export async function eliminarFirmaPersonal(firma: FirmaPersonal): Promise<{ error: string | null }> {
  const { error: errorStorage } = await supabase.storage.from(BUCKET).remove([firma.storage_path])
  if (errorStorage) return { error: errorStorage.message }
  const { error } = await supabase.from('firmas_personal').delete().eq('usuario_id', firma.usuario_id)
  return { error: error?.message ?? null }
}

export async function descargarBytesFirmaPersonal(storagePath: string): Promise<{ bytes: ArrayBuffer | null; error: string | null }> {
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath)
  if (error || !data) return { bytes: null, error: error?.message ?? 'No se pudo descargar la firma.' }
  return { bytes: await data.arrayBuffer(), error: null }
}
