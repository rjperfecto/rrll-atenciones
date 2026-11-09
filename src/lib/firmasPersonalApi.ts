import { supabase } from './supabaseClient'

const BUCKET = 'firmas-personal'

export interface FirmaPersonal {
  legajo: string
  storage_path: string
  creado_por: string
  creado_por_nombre: string
  created_at: string
  updated_at: string
}

export async function obtenerFirmaPersonal(legajo: string): Promise<FirmaPersonal | null> {
  const { data, error } = await supabase.from('firmas_personal').select('*').eq('legajo', legajo).maybeSingle()
  if (error || !data) return null
  return data as FirmaPersonal
}

// Batch (ver mismo patrón en busquedaApi.telefonosDeLegajos): Documento
// masivo no hace una consulta por cada trabajador de la lista.
export async function firmasDeLegajos(legajos: string[]): Promise<Map<string, FirmaPersonal>> {
  const mapa = new Map<string, FirmaPersonal>()
  if (legajos.length === 0) return mapa
  const { data } = await supabase.from('firmas_personal').select('*').in('legajo', legajos)
  for (const f of (data ?? []) as FirmaPersonal[]) mapa.set(f.legajo, f)
  return mapa
}

// path fijo por legajo (upsert: true) = volver a subir para el mismo legajo
// reemplaza la firma anterior, igual que subirDocumentoFirmado.
export async function subirFirmaPersonal(
  legajo: string,
  pngBytes: Uint8Array,
  creadoPor: string,
  creadoPorNombre: string,
): Promise<{ error: string | null }> {
  const path = `${legajo}.png`
  const copia = new Uint8Array(pngBytes.length)
  copia.set(pngBytes)
  const { error: errorSubida } = await supabase.storage.from(BUCKET).upload(path, copia, { contentType: 'image/png', upsert: true })
  if (errorSubida) return { error: errorSubida.message }

  const { error } = await supabase.from('firmas_personal').upsert({
    legajo,
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
  const { error } = await supabase.from('firmas_personal').delete().eq('legajo', firma.legajo)
  return { error: error?.message ?? null }
}

export async function descargarBytesFirmaPersonal(storagePath: string): Promise<{ bytes: ArrayBuffer | null; error: string | null }> {
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath)
  if (error || !data) return { bytes: null, error: error?.message ?? 'No se pudo descargar la firma.' }
  return { bytes: await data.arrayBuffer(), error: null }
}
