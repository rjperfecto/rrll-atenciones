import Dexie, { type EntityTable, type Table } from 'dexie'
import type { Atencion, TrabajadorHistorial } from '@/types'

// Dexie es la única fuente de verdad en el dispositivo: toda lectura de la UI
// pasa por aquí. Las atenciones se guardan localmente de inmediato (optimista)
// y el syncEngine las sube a Supabase cuando hay conexión (ver lib/sync.ts).
export const db = new Dexie('rrll-atenciones') as Dexie & {
  atenciones: EntityTable<Atencion, 'id'>
  trabajadoresHistorial: Table<TrabajadorHistorial, [string, string]>
}

db.version(1).stores({
  // boolean no es un tipo de clave válido en IndexedDB, así que "synced" no
  // se indexa: se filtra en memoria (el volumen local es chico, unos miles de filas).
  atenciones: 'id, client_uuid, fecha, zona, estado, responsable_id',
})

db.version(2).stores({
  atenciones: 'id, client_uuid, fecha, zona, estado, responsable_id',
  trabajadores: 'legajo',
})

db.version(3).stores({
  atenciones: 'id, client_uuid, fecha, zona, estado, responsable_id',
  trabajadores: null, // reemplazado por trabajadoresHistorial (historial por día)
  // clave compuesta legajo+fecha: permite buscar el dato del trabajador tal
  // como estaba en la fecha del caso, no solo el más reciente cargado.
  trabajadoresHistorial: '[legajo+fecha], legajo',
})
