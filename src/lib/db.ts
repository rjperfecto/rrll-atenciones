import Dexie, { type EntityTable } from 'dexie'
import type { Atencion, Trabajador } from '@/types'

// Dexie es la única fuente de verdad en el dispositivo: toda lectura de la UI
// pasa por aquí. Las atenciones se guardan localmente de inmediato (optimista)
// y el syncEngine las sube a Supabase cuando hay conexión (ver lib/sync.ts).
export const db = new Dexie('rrll-atenciones') as Dexie & {
  atenciones: EntityTable<Atencion, 'id'>
  trabajadores: EntityTable<Trabajador, 'legajo'>
}

db.version(1).stores({
  // boolean no es un tipo de clave válido en IndexedDB, así que "synced" no
  // se indexa: se filtra en memoria (el volumen local es chico, unos miles de filas).
  atenciones: 'id, client_uuid, fecha, zona, estado, responsable_id',
})

db.version(2).stores({
  atenciones: 'id, client_uuid, fecha, zona, estado, responsable_id',
  // maestro de personal, cacheado offline para autocompletar por legajo
  trabajadores: 'legajo',
})
