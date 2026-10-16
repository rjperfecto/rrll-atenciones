import { supabase } from './supabaseClient'
import type { PlantillaPdf, PosicionCampoPlantilla } from '@/types'

const BUCKET = 'plantillas-pdf'

export async function listarPlantillas(): Promise<{ data: PlantillaPdf[]; error: string | null }> {
  const { data, error } = await supabase.from('plantillas_pdf').select('*').order('nombre')
  return { data: (data as PlantillaPdf[]) ?? [], error: error?.message ?? null }
}

export async function subirPlantilla(
  nombre: string,
  archivo: File,
  creadoPor: string,
  creadoPorNombre: string,
): Promise<{ data: PlantillaPdf | null; error: string | null }> {
  const path = `${crypto.randomUUID()}.pdf`
  const { error: errorSubida } = await supabase.storage.from(BUCKET).upload(path, archivo, { contentType: 'application/pdf' })
  if (errorSubida) return { data: null, error: errorSubida.message }

  const { data, error } = await supabase
    .from('plantillas_pdf')
    .insert({
      id: crypto.randomUUID(),
      nombre: nombre.trim(),
      storage_path: path,
      posiciones: [],
      creado_por: creadoPor,
      creado_por_nombre: creadoPorNombre,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()
  if (error) {
    // Si falló el insert, no dejamos el archivo huérfano en el bucket.
    await supabase.storage.from(BUCKET).remove([path])
    return { data: null, error: error.message }
  }
  return { data: data as PlantillaPdf, error: null }
}

export async function actualizarPosicionesPlantilla(id: string, posiciones: PosicionCampoPlantilla[]): Promise<{ error: string | null }> {
  const { error } = await supabase.from('plantillas_pdf').update({ posiciones, updated_at: new Date().toISOString() }).eq('id', id)
  return { error: error?.message ?? null }
}

export async function eliminarPlantilla(plantilla: PlantillaPdf): Promise<{ error: string | null }> {
  const { error: errorStorage } = await supabase.storage.from(BUCKET).remove([plantilla.storage_path])
  if (errorStorage) return { error: errorStorage.message }
  const { error } = await supabase.from('plantillas_pdf').delete().eq('id', plantilla.id)
  return { error: error?.message ?? null }
}

export async function descargarBytesPlantilla(storagePath: string): Promise<{ bytes: ArrayBuffer | null; error: string | null }> {
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath)
  if (error || !data) return { bytes: null, error: error?.message ?? 'No se pudo descargar el archivo.' }
  return { bytes: await data.arrayBuffer(), error: null }
}
