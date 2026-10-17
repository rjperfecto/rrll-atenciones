import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { listarConflictividad, type ConflictividadGrupo } from '@/lib/conflictividadApi'
import { listarGrupoFundoActual, listarCaminatasPorGrupo, listarCantidadPersonasPorGrupo } from '@/lib/tableroConflictividadApi'
import { zonaDesdeFundo } from '@/lib/zonaFundo'
import { CardSection, Card } from '@/components/ui/Card'
import { GRAVEDAD_COLORES } from '@/components/ui/Badge'

const ZONAS_TABLERO = ['ZONA 1', 'ZONA 2', 'ZONA 3'] as const

type FilaTablero = ConflictividadGrupo & { fundo: string | null; caminatas: number; personas: number }

// Solo informativo (no se programa nada acá, ver ProximasCaminatas arriba):
// un grupo por fila. La zona de cada grupo se deriva de su fundo más
// reciente en TAREO (v_grupo_fundo_actual) — un grupo sin fila de TAREO
// todavía, o en Packing/CAE/Oficina, no entra en ninguna de las 3 columnas.
// Orden: primero los grupos sin ninguna caminata hecha (0), y entre esos (y
// el resto) por conflictividad de mayor a menor — así se ve primero a quién
// no se le ha hecho nada, priorizado por qué tan crítico es.
export function TableroConflictividad() {
  const [filas, setFilas] = useState<FilaTablero[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    async function cargar() {
      const [{ data: conflictividad, error: err }, fundoPorGrupo, caminatasPorGrupo, personasPorGrupo] = await Promise.all([
        listarConflictividad(),
        listarGrupoFundoActual(),
        listarCaminatasPorGrupo(),
        listarCantidadPersonasPorGrupo(),
      ])
      if (cancelado) return
      if (err) {
        setError(err)
        return
      }
      setFilas(
        conflictividad.map((c) => ({
          ...c,
          fundo: fundoPorGrupo.get(c.grupo) ?? null,
          caminatas: caminatasPorGrupo.get(c.grupo) ?? 0,
          personas: personasPorGrupo.get(c.grupo) ?? 0,
        })),
      )
    }
    void cargar()
    return () => {
      cancelado = true
    }
  }, [])

  const porZona = useMemo(() => {
    const mapa = new Map<string, FilaTablero[]>()
    for (const zona of ZONAS_TABLERO) mapa.set(zona, [])
    for (const f of filas ?? []) {
      const zona = f.fundo ? zonaDesdeFundo(f.fundo) : null
      if (!zona || !mapa.has(zona)) continue
      mapa.get(zona)!.push(f)
    }
    for (const lista of mapa.values()) {
      lista.sort((a, b) => {
        const aSinCaminatas = a.caminatas === 0 ? 0 : 1
        const bSinCaminatas = b.caminatas === 0 ? 0 : 1
        if (aSinCaminatas !== bSinCaminatas) return aSinCaminatas - bSinCaminatas
        return b.valor - a.valor
      })
    }
    return mapa
  }, [filas])

  if (error) {
    return (
      <Card className="p-6 flex flex-col items-center text-center gap-2 mb-4">
        <AlertCircle className="size-8 text-red-300" />
        <p className="text-sm text-neutral-600">{error}</p>
      </Card>
    )
  }

  if (!filas) {
    return (
      <Card className="p-10 flex items-center justify-center mb-4">
        <Loader2 className="size-6 text-brand animate-spin" />
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
      {ZONAS_TABLERO.map((zona) => (
        <CardSection key={zona} title={zona}>
          {porZona.get(zona)!.length === 0 ? (
            <p className="text-sm text-neutral-400">Sin grupos con conflictividad cargada para esta zona.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {porZona.get(zona)!.map((f) => (
                <li key={f.grupo} className="flex items-center gap-2 py-2">
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: GRAVEDAD_COLORES[f.nivel] }}
                    title={f.nivel}
                    aria-label={`Conflictividad ${f.nivel}`}
                  />
                  <p className="text-sm font-medium text-neutral-800 truncate flex-1">
                    {f.grupo} ({f.personas} persona{f.personas === 1 ? '' : 's'})
                  </p>
                  <div className="text-xs text-neutral-500 shrink-0 text-right">
                    <p>
                      {f.caminatas} caminata{f.caminatas === 1 ? '' : 's'}
                    </p>
                    <p className="text-neutral-400">{f.fundo ?? '—'}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardSection>
      ))}
    </div>
  )
}
