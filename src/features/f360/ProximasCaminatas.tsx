import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, CalendarPlus, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { listarCaminatasProgramadas, programarCaminata, eliminarCaminataProgramada } from '@/lib/caminatasProgramadasApi'
import { buscarGrupoCompleto, type ResultadoGrupo } from '@/lib/busquedaApi'
import { listarConflictividad, type ConflictividadGrupo } from '@/lib/conflictividadApi'
import { moduloDesdeFundo } from '@/lib/modulo'
import { useAuth } from '@/features/auth/AuthContext'
import { CardSection } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { GravedadBadge } from '@/components/ui/Badge'
import type { CaminataProgramada } from '@/types'

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

// Solo guarda Grupo + Fecha (migración 0030): Zona, Fundo y Líder se buscan
// en vivo desde TAREO acá mismo (buscarGrupoCompleto), no se duplican. Es un
// recordatorio, no se conecta solo con el registro real: "Cerrar" manda a
// Registrar caminata con el grupo/fecha precargados (quien cierra no tiene
// que ser quien la programó — lo hace el responsable de esa zona) y borra
// la programación, dándola por cumplida.
export function ProximasCaminatas() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [programadas, setProgramadas] = useState<CaminataProgramada[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [grupo, setGrupo] = useState('')
  const [fecha, setFecha] = useState(hoy())
  const [agregando, setAgregando] = useState(false)
  const [errorAgregar, setErrorAgregar] = useState<string | null>(null)
  const [procesandoId, setProcesandoId] = useState<string | null>(null)
  const [info, setInfo] = useState<Record<string, ResultadoGrupo | null>>({})
  const [conflictividad, setConflictividad] = useState<Map<string, ConflictividadGrupo>>(new Map())

  const cargar = useCallback(async () => {
    const { data, error: err } = await listarCaminatasProgramadas()
    setProgramadas(data)
    setError(err)
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  useEffect(() => {
    void listarConflictividad().then(({ data }) => setConflictividad(new Map(data.map((c) => [c.grupo, c]))))
  }, [])

  useEffect(() => {
    if (!programadas) return
    let cancelado = false
    void (async () => {
      for (const p of programadas) {
        const clave = `${p.grupo}|${p.fecha}`
        if (clave in info) continue
        const r = await buscarGrupoCompleto(p.grupo, p.fecha)
        if (!cancelado) setInfo((prev) => ({ ...prev, [clave]: r }))
      }
    })()
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programadas])

  async function agregar() {
    if (!profile || !grupo.trim()) return
    setErrorAgregar(null)
    setAgregando(true)
    const { error: err } = await programarCaminata(grupo, fecha, profile.id, profile.nombre_completo)
    setAgregando(false)
    if (err) {
      setErrorAgregar(`No se pudo programar: ${err}`)
      return
    }
    setGrupo('')
    void cargar()
  }

  async function eliminar(p: CaminataProgramada) {
    const confirmado = window.confirm(`¿Quitar la caminata programada de "${p.grupo}" (${p.fecha})?`)
    if (!confirmado) return
    setProcesandoId(p.id)
    const { error: err } = await eliminarCaminataProgramada(p.id)
    setProcesandoId(null)
    if (err) {
      window.alert(`No se pudo eliminar: ${err}`)
      return
    }
    void cargar()
  }

  async function cerrar(p: CaminataProgramada) {
    setProcesandoId(p.id)
    const { error: err } = await eliminarCaminataProgramada(p.id)
    setProcesandoId(null)
    if (err) {
      window.alert(`No se pudo cerrar: ${err}`)
      return
    }
    void cargar()
    navigate(`/360/registrar?grupo=${encodeURIComponent(p.grupo)}&fecha=${p.fecha}`)
  }

  const puedeBorrar = (p: CaminataProgramada) => profile?.id === p.creado_por || profile?.rol === 'ADMIN'

  // Ordenadas por conflictividad (mayor primero), igual que el tablero de
  // abajo: así se puede presentar la tabla directamente, priorizada.
  const programadasOrdenadas = useMemo(() => {
    if (!programadas) return []
    return [...programadas].sort((a, b) => (conflictividad.get(b.grupo)?.valor ?? -1) - (conflictividad.get(a.grupo)?.valor ?? -1))
  }, [programadas, conflictividad])

  return (
    <CardSection title="Programar caminata" icon={<CalendarPlus className="size-4 text-brand" />} className="mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
        <Field label="Grupo">
          <input type="text" placeholder="CH12" value={grupo} onChange={(e) => setGrupo(e.target.value.toUpperCase())} className="input" />
        </Field>
        <Field label="Fecha">
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="input" />
        </Field>
        <Button type="button" onClick={agregar} loading={agregando} disabled={!grupo.trim()} className="shrink-0">
          <Plus className="size-4" />
          Programar
        </Button>
      </div>
      {errorAgregar && (
        <p className="text-xs text-danger flex items-center gap-1.5">
          <AlertCircle className="size-3.5 shrink-0" />
          {errorAgregar}
        </p>
      )}

      {error && (
        <p className="text-sm text-danger flex items-center gap-1.5">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </p>
      )}

      {programadas === null ? (
        <p className="text-sm text-neutral-400">Cargando...</p>
      ) : programadas.length === 0 ? (
        <p className="text-sm text-neutral-400">No hay caminatas programadas.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-700 text-white">
                <th className="px-3 py-2 font-semibold whitespace-nowrap">FECHA</th>
                <th className="px-3 py-2 font-semibold whitespace-nowrap">RESPONSABLE</th>
                <th className="px-3 py-2 font-semibold whitespace-nowrap">MÓDULO</th>
                <th className="px-3 py-2 font-semibold whitespace-nowrap">GRUPO</th>
                <th className="px-3 py-2 font-semibold whitespace-nowrap">LÍDER</th>
                <th className="px-3 py-2 font-semibold whitespace-nowrap">CONFLICTIVIDAD</th>
                <th className="px-3 py-2 font-semibold whitespace-nowrap"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {programadasOrdenadas.map((p) => {
                const clave = `${p.grupo}|${p.fecha}`
                const r = info[clave]
                const modulo = r?.ubicacion ? (moduloDesdeFundo(r.ubicacion) ?? r.ubicacion) : null
                const nivelConflictividad = conflictividad.get(p.grupo)?.nivel
                const cargandoFila = r === undefined
                return (
                  <tr key={p.id} className="text-center even:bg-neutral-50">
                    <td className="px-3 py-2 whitespace-nowrap">{p.fecha}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{p.creado_por_nombre.toUpperCase()}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{cargandoFila ? '…' : (modulo ?? '—')}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-medium">{p.grupo}</td>
                    <td className="px-3 py-2">{cargandoFila ? '…' : (r?.lider?.nombre_completo ?? '—')}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {nivelConflictividad ? <GravedadBadge gravedad={nivelConflictividad} /> : '—'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button onClick={() => cerrar(p)} loading={procesandoId === p.id} className="text-xs px-2.5 py-1.5">
                          <CheckCircle2 className="size-3.5" />
                          Cerrar
                        </Button>
                        {puedeBorrar(p) && (
                          <button
                            type="button"
                            onClick={() => eliminar(p)}
                            disabled={procesandoId === p.id}
                            className="p-1.5 rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-danger"
                            aria-label="Quitar"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </CardSection>
  )
}
