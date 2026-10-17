import { useEffect, useMemo, useState } from 'react'
import { Award, CalendarRange, Gauge, Handshake, Sprout, Users } from 'lucide-react'
import { listarGrupoFundoActual, listarCantidadPersonasPorGrupo } from '@/lib/tableroConflictividadApi'
import {
  listarSemanasConDatos,
  obtenerCasosPorResponsableSemanas,
  obtenerCasosPorZonaSemanas,
  type CasosPorResponsable,
  type CasosPorZonaSimple,
} from '@/lib/resumenApi'
import { zonaDesdeFundo } from '@/lib/zonaFundo'
import { CardSection, Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatTile } from '@/components/ui/StatTile'
import { cn } from '@/lib/cn'

const ZONAS_RESUMEN = ['ZONA 1', 'ZONA 2', 'ZONA 3'] as const
const PURPLE = '#673ab7'
const BLUE = '#2196f3'

// Ranking tipo "Top responsables" (mismo patrón que el Dashboard de
// Atenciones): barra de progreso relativa al máximo del grupo, no un
// porcentaje del total — así se ve quién tiene más carga de un vistazo.
function RankingResponsables({ datos, color }: { datos: CasosPorResponsable[]; color: string }) {
  const max = Math.max(1, ...datos.map((d) => d.casos))
  if (datos.length === 0) return <p className="text-sm text-neutral-400">Sin datos para este filtro.</p>
  return (
    <div className="space-y-3">
      {datos.map((r, i) => (
        <div key={r.responsable}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="flex items-center gap-2 min-w-0">
              <span className="flex items-center justify-center size-5 rounded-full bg-navy-soft text-navy text-[11px] font-bold shrink-0">
                {i + 1}
              </span>
              <span className="text-sm text-neutral-700 truncate">{r.responsable.toUpperCase()}</span>
            </span>
            <span className="text-sm font-semibold text-neutral-900 shrink-0">{r.casos}</span>
          </div>
          <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.round((r.casos / max) * 100)}%`, backgroundColor: color }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// Resumen operativo general (no reemplaza los Dashboards de Atenciones/360
// Laboral, los complementa): cuánto personal/grupos hay HOY por zona (sin
// filtro de semana, es una foto actual), y — con el filtro de semanas — a
// quién se le atribuyen los casos y qué % del personal de cada zona quedó
// cubierto por al menos una atención en ese período.
export function DashboardResumen() {
  const [grupoFundo, setGrupoFundo] = useState<Map<string, string | null> | null>(null)
  const [personasPorGrupo, setPersonasPorGrupo] = useState<Map<string, number> | null>(null)
  const [semanasDisponibles, setSemanasDisponibles] = useState<{ anio: number; semana: number }[]>([])
  const [semanasSeleccionadas, setSemanasSeleccionadas] = useState<Set<number>>(new Set())
  const [casosAtenciones, setCasosAtenciones] = useState<CasosPorResponsable[]>([])
  const [casos360, setCasos360] = useState<CasosPorResponsable[]>([])
  const [casosZonaAtenciones, setCasosZonaAtenciones] = useState<CasosPorZonaSimple[]>([])
  const [cargando, setCargando] = useState(true)

  // Foto de hoy (grupos/personal) y la lista de semanas con datos: una sola vez.
  useEffect(() => {
    void Promise.all([listarGrupoFundoActual(), listarCantidadPersonasPorGrupo(), listarSemanasConDatos()]).then(
      ([fundo, personas, semanas]) => {
        setGrupoFundo(fundo)
        setPersonasPorGrupo(personas)
        setSemanasDisponibles(semanas)
      },
    )
  }, [])

  // Año de trabajo: el más reciente que tenga datos (ver limitación de mezclar
  // semanas de años distintos en el comentario de la migración 0033).
  const anio = useMemo(() => Math.max(0, ...semanasDisponibles.map((s) => s.anio)) || null, [semanasDisponibles])
  const semanasDelAnio = useMemo(
    () => [...new Set(semanasDisponibles.filter((s) => s.anio === anio).map((s) => s.semana))].sort((a, b) => a - b),
    [semanasDisponibles, anio],
  )

  useEffect(() => {
    const semanas = semanasSeleccionadas.size > 0 ? [...semanasSeleccionadas] : null
    setCargando(true)
    void Promise.all([
      obtenerCasosPorResponsableSemanas(['GENERAL'], anio, semanas),
      obtenerCasosPorResponsableSemanas(['360 LABORAL'], anio, semanas),
      obtenerCasosPorZonaSemanas(['GENERAL'], anio, semanas),
    ]).then(([atenciones, laboral360, zonaAtenciones]) => {
      setCasosAtenciones(atenciones.data)
      setCasos360(laboral360.data)
      setCasosZonaAtenciones(zonaAtenciones.data)
      setCargando(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anio, [...semanasSeleccionadas].sort().join(',')])

  function toggleSemana(semana: number) {
    setSemanasSeleccionadas((prev) => {
      const siguiente = new Set(prev)
      if (siguiente.has(semana)) siguiente.delete(semana)
      else siguiente.add(semana)
      return siguiente
    })
  }

  const porZona = useMemo(() => {
    if (!grupoFundo || !personasPorGrupo) return null
    const base = new Map<string, { zona: string; grupos: number; personas: number }>(
      ZONAS_RESUMEN.map((z) => [z, { zona: z, grupos: 0, personas: 0 }]),
    )
    for (const [grupo, fundo] of grupoFundo) {
      const zona = fundo ? zonaDesdeFundo(fundo) : null
      if (!zona || !base.has(zona)) continue
      const fila = base.get(zona)!
      fila.grupos += 1
      fila.personas += personasPorGrupo.get(grupo) ?? 0
    }
    return [...base.values()]
  }, [grupoFundo, personasPorGrupo])

  const totalGrupos = porZona?.reduce((acc, z) => acc + z.grupos, 0) ?? 0
  const totalPersonal = porZona?.reduce((acc, z) => acc + z.personas, 0) ?? 0

  const cobertura = useMemo(() => {
    if (!porZona) return []
    const atencionesPorZona = new Map(casosZonaAtenciones.map((c) => [c.zona, c.casos]))
    return porZona.map((z) => {
      const atenciones = atencionesPorZona.get(z.zona) ?? 0
      const pct = z.personas > 0 ? Math.round((atenciones / z.personas) * 1000) / 10 : 0
      return { zona: z.zona, atenciones, personas: z.personas, pct }
    })
  }, [porZona, casosZonaAtenciones])

  if (!porZona) return <p className="text-sm text-neutral-500">Cargando...</p>

  return (
    <div>
      <PageHeader title="Resumen" description="Grupos y personal por zona hoy, y actividad del equipo de RRLL por semana." />

      <CardSection title="Personal y grupos por zona (hoy)" icon={<Users className="size-4 text-brand" />} className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatTile variant="gradient" label="Grupos totales" value={totalGrupos} icon={<Sprout className="size-5" />} accent={PURPLE} />
          <StatTile variant="gradient" label="Personal total" value={totalPersonal} icon={<Users className="size-5" />} accent={BLUE} />
          {porZona.map((z) => (
            <Card key={z.zona} className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{z.zona}</p>
              <p className="text-2xl font-semibold text-neutral-900 mt-1">{z.personas}</p>
              <p className="text-xs text-neutral-500">personal en {z.grupos} grupos</p>
            </Card>
          ))}
        </div>
        <p className="text-xs text-neutral-400 mt-3">Según el último día de TAREO cargado para cada grupo (no una fecha fija).</p>
      </CardSection>

      <Card className="p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <CalendarRange className="size-4 text-neutral-400" />
          <p className="text-sm font-medium text-neutral-700">Semanas a considerar{anio ? ` (${anio})` : ''}</p>
          {semanasSeleccionadas.size > 0 && (
            <button type="button" onClick={() => setSemanasSeleccionadas(new Set())} className="text-xs text-brand hover:underline ml-auto">
              Limpiar (ver todas)
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {semanasDelAnio.map((s) => {
            const activo = semanasSeleccionadas.has(s)
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSemana(s)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                  activo ? 'bg-brand text-white border-brand' : 'bg-white text-neutral-600 border-neutral-200 hover:border-brand/40',
                )}
              >
                S{s}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-neutral-400 mt-2">
          {semanasSeleccionadas.size === 0 ? 'Sin marcar ninguna = todas las semanas.' : `${semanasSeleccionadas.size} semana(s) combinadas.`}
        </p>
      </Card>

      <div className={cn('grid gap-6 grid-cols-1 md:grid-cols-2 mb-6', cargando && 'opacity-50 pointer-events-none')}>
        <CardSection title="Atenciones por responsable" icon={<Handshake className="size-4 text-brand" />}>
          <RankingResponsables datos={casosAtenciones} color={PURPLE} />
        </CardSection>
        <CardSection title="360 Laboral por responsable" icon={<Award className="size-4 text-brand" />}>
          <RankingResponsables datos={casos360} color={BLUE} />
        </CardSection>
      </div>

      <CardSection title="% de cobertura por zona" icon={<Gauge className="size-4 text-brand" />}>
        <p className="text-xs text-neutral-400 mb-3">Atenciones registradas en el período ÷ personal total de la zona (hoy).</p>
        <div className="space-y-3">
          {cobertura.map((c) => (
            <div key={c.zona}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm text-neutral-700">{c.zona}</span>
                <span className="text-xs text-neutral-500">
                  {c.atenciones} atención{c.atenciones === 1 ? '' : 'es'} / {c.personas} personal
                </span>
                <span className="text-sm font-semibold text-neutral-900 shrink-0">{c.pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, c.pct)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </CardSection>
    </div>
  )
}
