import { supabase } from './supabaseClient'

export type DocumentoCarta360 = 'COMPROMISOS' | 'VERIFICACION'

interface FilaTextosCarta360 {
  documento: DocumentoCarta360
  textos: Record<string, string>
  actualizado_por: string
  actualizado_por_nombre: string
  updated_at: string
}

// Solo guarda los campos que el admin realmente personalizó (ver
// TextosCartas360.tsx): un campo sin override acá sigue usando el
// defaultTexto del catálogo en textosCartas360.ts, así que un cambio de
// redacción en el código a futuro no queda tapado por un valor guardado
// que nadie tocó.
export async function obtenerTextosCarta(documento: DocumentoCarta360): Promise<Record<string, string>> {
  const { data } = await supabase.from('textos_cartas_360').select('*').eq('documento', documento).maybeSingle()
  return (data as FilaTextosCarta360 | null)?.textos ?? {}
}

export async function guardarTextosCarta(
  documento: DocumentoCarta360,
  textos: Record<string, string>,
  actualizadoPor: string,
  actualizadoPorNombre: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('textos_cartas_360').upsert({
    documento,
    textos,
    actualizado_por: actualizadoPor,
    actualizado_por_nombre: actualizadoPorNombre,
    updated_at: new Date().toISOString(),
  })
  return { error: error?.message ?? null }
}
