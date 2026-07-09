import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { pushPending } from '@/lib/sync'
import { useAuth } from '@/features/auth/AuthContext'
import type { Atencion } from '@/types'

const gravedadColor: Record<string, string> = {
  BAJO: 'bg-emerald-100 text-emerald-800',
  MEDIO: 'bg-amber-100 text-amber-800',
  ALTO: 'bg-red-100 text-red-800',
}

const estadoColor: Record<string, string> = {
  ABIERTO: 'bg-neutral-100 text-neutral-700',
  EN_PROCESO: 'bg-blue-100 text-blue-800',
  CERRADO: 'bg-neutral-200 text-neutral-500',
}

export function AtencionList() {
  const { profile } = useAuth()
  const [cerrando, setCerrando] = useState<string | null>(null)
  const [detalle, setDetalle] = useState('')

  const atenciones = useLiveQuery(async () => {
    const all = await db.atenciones.orderBy('fecha').reverse().toArray()
    if (!profile) return []
    return profile.rol === 'ADMIN' ? all : all.filter((a) => a.responsable_id === profile.id)
  }, [profile])

  async function cerrarCaso(a: Atencion) {
    await db.atenciones.update(a.id, {
      estado: 'CERRADO',
      detalle_cierre: detalle,
      updated_at: new Date().toISOString(),
      synced: false,
    })
    setCerrando(null)
    setDetalle('')
    void pushPending()
  }

  if (!atenciones) return <p className="text-sm text-neutral-500">Cargando...</p>
  if (atenciones.length === 0) {
    return <p className="text-sm text-neutral-500">Todavía no hay atenciones registradas.</p>
  }

  return (
    <div className="space-y-3">
      {atenciones.map((a) => (
        <div key={a.id} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-sm font-medium text-neutral-900">{a.fecha}</span>
            <span className="text-xs text-neutral-500">{a.zona}</span>
            {a.fundo && <span className="text-xs text-neutral-500">· {a.fundo}</span>}
            <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${gravedadColor[a.gravedad]}`}>
              {a.gravedad}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor[a.estado]}`}>
              {a.estado.replace('_', ' ')}
            </span>
            {!a.synced && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Pendiente de sincronizar
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-800">
            <span className="font-medium">{a.tipo}</span> · {a.categoria} · {a.subcategoria}
          </p>
          <p className="text-sm text-neutral-600 mt-1">
            {a.involucrados[0]?.nombre_completo}
            {a.involucrados[0]?.dni && ` (DNI ${a.involucrados[0].dni})`}
          </p>
          {a.comentarios && <p className="text-sm text-neutral-500 mt-1">{a.comentarios}</p>}
          <p className="text-xs text-neutral-400 mt-2">Responsable: {a.responsable_nombre}</p>

          {a.estado !== 'CERRADO' && (
            <div className="mt-3">
              {cerrando === a.id ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Detalle del cierre"
                    value={detalle}
                    onChange={(e) => setDetalle(e.target.value)}
                    className="input"
                  />
                  <button
                    onClick={() => cerrarCaso(a)}
                    className="rounded-md bg-brand text-white px-3 py-1 text-sm whitespace-nowrap"
                  >
                    Confirmar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCerrando(a.id)}
                  className="text-sm text-brand hover:underline"
                >
                  Cerrar caso
                </button>
              )}
            </div>
          )}
          {a.estado === 'CERRADO' && a.detalle_cierre && (
            <p className="text-xs text-neutral-500 mt-2 italic">Cierre: {a.detalle_cierre}</p>
          )}
        </div>
      ))}
    </div>
  )
}
