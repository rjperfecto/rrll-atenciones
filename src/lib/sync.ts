import { db } from './db'
import { supabase, isSupabaseConfigured } from './supabaseClient'
import type { Atencion, TrabajadorHistorial } from '@/types'

let syncing = false

// Patrón "outbox": toda atención se guarda primero en Dexie (synced=false).
// pushPending intenta subir lo pendiente a Supabase; si falla (sin red, por
// ejemplo) simplemente lo deja para el próximo intento. client_uuid es la
// clave idempotente que evita duplicados si una misma atención se sube dos veces.
export async function pushPending(): Promise<{ subidas: number; fallidas: number }> {
  if (syncing || !isSupabaseConfigured || !navigator.onLine) {
    return { subidas: 0, fallidas: 0 }
  }
  syncing = true
  let subidas = 0
  let fallidas = 0
  try {
    const pendientes = (await db.atenciones.toArray()).filter((a) => !a.synced)
    for (const atencion of pendientes) {
      const { synced: _synced, ...payload } = atencion
      const { error } = await supabase.from('atenciones').upsert(payload, { onConflict: 'client_uuid' })
      if (error) {
        fallidas++
        continue
      }
      await db.atenciones.update(atencion.id, { synced: true })
      subidas++
    }
  } finally {
    syncing = false
  }
  return { subidas, fallidas }
}

export async function pullRemotas(responsableId: string, isAdmin: boolean): Promise<void> {
  if (!isSupabaseConfigured || !navigator.onLine) return
  let query = supabase.from('atenciones').select('*').order('fecha', { ascending: false }).limit(500)
  if (!isAdmin) query = query.eq('responsable_id', responsableId)
  const { data, error } = await query
  if (error || !data) return
  await db.atenciones.bulkPut((data as Atencion[]).map((a) => ({ ...a, synced: true })))
}

export async function pullTrabajadoresHistorial(): Promise<void> {
  if (!isSupabaseConfigured || !navigator.onLine) return
  // Supabase/PostgREST tiene un tope de filas por consulta (típicamente 1000,
  // pero puede ser otro según cómo esté configurado el proyecto). Pedimos el
  // total real con count:'exact' y avanzamos el cursor según lo que
  // efectivamente llega en cada tanda (no según lo pedido) — si el tope real
  // del servidor fuera menor al que asumimos, avanzar por lo pedido saltearía
  // filas sin que nos diéramos cuenta.
  const tandaPedida = 1000
  const { count, error: countError } = await supabase
    .from('trabajadores_historial')
    .select('*', { count: 'exact', head: true })
  if (countError) return
  const total = count ?? 0

  const todos: TrabajadorHistorial[] = []
  let desde = 0
  while (desde < total) {
    const { data, error } = await supabase
      .from('trabajadores_historial')
      .select('*')
      .range(desde, desde + tandaPedida - 1)
    if (error) return
    const recibidas = data ?? []
    if (recibidas.length === 0) break // evita loop infinito si algo no cuadra
    todos.push(...(recibidas as TrabajadorHistorial[]))
    desde += recibidas.length
  }
  await db.trabajadoresHistorial.clear()
  await db.trabajadoresHistorial.bulkPut(todos)
}

export function setupAutoSync(onSync: () => void) {
  const tryPush = () => {
    void pushPending().then((r) => {
      if (r.subidas > 0) onSync()
    })
  }
  window.addEventListener('online', tryPush)
  const interval = setInterval(tryPush, 30_000)
  tryPush()
  return () => {
    window.removeEventListener('online', tryPush)
    clearInterval(interval)
  }
}
