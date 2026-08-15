import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { LabelProps, PieLabelRenderProps, TooltipContentProps } from 'recharts'
import {
  obtenerReportesDashboard,
  type CasosPorGravedad,
  type CasosPorResponsableGravedad,
  type CasosPorZonaGravedad,
  type CasosPorZona,
  type CasosPorEstado,
  type CasosPorSemana,
  type FiltroSemana,
} from '@/lib/reportesApi'
import { CardSection } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatTile } from '@/components/ui/StatTile'
import { GRAVEDAD_COLORES, ESTADO_COLORES } from '@/components/ui/Badge'
import { ClipboardList, Clock, CheckCircle2, TrendingUp, Award, CalendarRange } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { TipoRegistro } from '@/types'

export interface OpcionTipoDashboard {
  label: string
  tipos: TipoRegistro[]
}

// Reemplaza la hoja "INDICADOR" del Excel: casos por zona, por gravedad, y
// cruce zona x gravedad. Los totales se calculan en Supabase (RPC casos_por_*,
// migración 0017), no trayendo todas las atenciones al navegador — y esos RPC
// aceptan filtrar por semana ISO (ver selector "Semana" abajo).

const GRIS_EJE = '#e5e7eb' // neutral-200: gridlines recesivas, nunca protagonistas
const PURPLE = '#673ab7' // --color-brand (ver src/index.css)
const BLUE = '#2196f3' // --color-secondary

// Escala azul/morado (ver src/index.css --color-blue-*/--color-purple-*),
// alternada para que categorías vecinas en el gráfico no queden en tonos
// contiguos difíciles de distinguir.
const PALETA_ZONA = ['#2196f3', '#673ab7', '#64b5f6', '#9575cd', '#1565c0', '#4527a0']

interface Datos {
  porZona: CasosPorZona[]
  porGravedad: CasosPorGravedad[]
  porResponsableGravedad: CasosPorResponsableGravedad[]
  porZonaGravedad: CasosPorZonaGravedad[]
  porEstado: CasosPorEstado[]
  porSemana: CasosPorSemana[]
}

// Tooltip compartido: el valor va primero y en negrita (es lo que el lector
// busca), la serie/categoría queda secundaria, y la identidad de color se
// marca con una línea corta (line-key) en vez de un cuadro sólido.
function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-neutral-200 bg-white px-3 py-2 shadow-md text-xs min-w-[7rem]">
      {label && <p className="font-medium text-neutral-600 mb-1">{label}</p>}
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={String(entry.dataKey)} className="flex items-center gap-2">
            <span className="inline-block w-3 h-0.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="font-semibold text-neutral-900 tabular-nums">{entry.value}</span>
            {entry.name && <span className="text-neutral-500">{entry.name}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

// Texto con halo (contorno oscuro grueso detrás del relleno blanco, técnica
// paint-order: stroke luego fill): se lee fuerte encima de cualquier color de
// fondo, así que no depende de acertar el contraste exacto de cada segmento.
function TextoNotorio({ fontSize, ...props }: React.SVGProps<SVGTextElement> & { fontSize: number }) {
  return (
    <text
      {...props}
      fontSize={fontSize}
      fontWeight={800}
      fill="#fff"
      stroke="rgba(15, 23, 42, 0.55)"
      strokeWidth={fontSize * 0.28}
      strokeLinejoin="round"
      paintOrder="stroke fill"
    >
      {props.children}
    </text>
  )
}

// Número del valor, bien visible dentro del propio segmento del pie (no solo
// en el tooltip al pasar el mouse). Oculto si el valor es 0 para no ensuciar
// segmentos vacíos.
function EtiquetaValorPie({ cx, cy, midAngle, innerRadius, outerRadius, value }: PieLabelRenderProps) {
  if (!value) return null
  const RADIAN = Math.PI / 180
  const radio = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) / 2
  const x = Number(cx) + radio * Math.cos(-Number(midAngle) * RADIAN)
  const y = Number(cy) + radio * Math.sin(-Number(midAngle) * RADIAN)
  return (
    <TextoNotorio x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={17}>
      {value}
    </TextoNotorio>
  )
}

// Mismo criterio para las barras apiladas: el número va centrado dentro de
// cada segmento de color, oculto si el segmento es 0.
function EtiquetaValorBarra({ x, y, width, height, value }: LabelProps) {
  if (!value) return null
  return (
    <TextoNotorio
      x={Number(x ?? 0) + Number(width ?? 0) / 2}
      y={Number(y ?? 0) + Number(height ?? 0) / 2}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={14}
    >
      {value}
    </TextoNotorio>
  )
}

// Encima de cada punto de la tendencia semanal: el área ya está coloreada por
// dentro, así que el halo es lo que hace legible el número aunque el punto
// caiga sobre el degradado.
function EtiquetaValorPunto({ x, y, value }: LabelProps) {
  if (!value) return null
  return (
    <TextoNotorio x={Number(x ?? 0)} y={Number(y ?? 0) - 14} textAnchor="middle" dominantBaseline="central" fontSize={13}>
      {value}
    </TextoNotorio>
  )
}

// Un solo componente reusado por las 2 rutas de Dashboard (Atenciones —
// fusiona GENERAL+COSECHA con un selector interno TODOS/COSECHA — y 360
// Laboral, ver App.tsx): opcionesTipo trae 1 opción fija (360 Laboral) o
// varias (Atenciones), y solo se muestra el selector si hay más de una. Los
// RPC filtran en el servidor por esa lista de tipos (y por semana, si hay filtro).
export function Dashboard({ titulo, opcionesTipo }: { titulo: string; opcionesTipo: OpcionTipoDashboard[] }) {
  const [datos, setDatos] = useState<Datos | null>(null)
  const [cargando, setCargando] = useState(true)
  const [filtroSemana, setFiltroSemana] = useState<FiltroSemana | null>(null)
  const [indiceTipo, setIndiceTipo] = useState(0)
  const opcionTipo = opcionesTipo[indiceTipo] ?? opcionesTipo[0]

  // Cambiar de Dashboard (Atenciones/360 Laboral) o de opción TODOS/COSECHA
  // no debe arrastrar el filtro de semana del anterior.
  useEffect(() => {
    setFiltroSemana(null)
    setIndiceTipo(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titulo])

  useEffect(() => {
    setCargando(true)
    void obtenerReportesDashboard(opcionTipo.tipos, filtroSemana).then((r) => {
      setDatos(r)
      setCargando(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opcionTipo.tipos.join(','), filtroSemana])

  const porZona = useMemo(
    () => (datos ? datos.porZona.map((z) => ({ zona: z.zona, casos: z.casos })) : []),
    [datos],
  )

  const porGravedad = useMemo(
    () => (datos ? datos.porGravedad.map((g) => ({ gravedad: g.gravedad, casos: g.casos })) : []),
    [datos],
  )

  const porResponsable = useMemo(() => {
    if (!datos) return []
    const map = new Map<string, { responsable: string; BAJO: number; MEDIO: number; ALTO: number }>()
    for (const r of datos.porResponsableGravedad) {
      const row = map.get(r.responsable) ?? { responsable: r.responsable, BAJO: 0, MEDIO: 0, ALTO: 0 }
      row[r.gravedad] = r.casos
      map.set(r.responsable, row)
    }
    return [...map.values()]
  }, [datos])

  const porZonaGravedad = useMemo(() => {
    if (!datos) return []
    const map = new Map<string, { zona: string; BAJO: number; MEDIO: number; ALTO: number }>()
    for (const z of datos.porZonaGravedad) {
      const row = map.get(z.zona) ?? { zona: z.zona, BAJO: 0, MEDIO: 0, ALTO: 0 }
      row[z.gravedad] = z.casos
      map.set(z.zona, row)
    }
    return [...map.values()]
  }, [datos])

  // Ranking de responsables por total de casos: reemplaza al panel de
  // "acciones populares" del template de referencia con el dato real
  // equivalente que sí existe en esta app (no hay cotizaciones de bolsa
  // en un sistema de relaciones laborales).
  const topResponsables = useMemo(() => {
    const conTotal = porResponsable.map((r) => ({ ...r, total: r.BAJO + r.MEDIO + r.ALTO }))
    const max = Math.max(1, ...conTotal.map((r) => r.total))
    return conTotal
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((r) => ({ ...r, pct: Math.round((r.total / max) * 100) }))
  }, [porResponsable])

  // Últimas 12 semanas con datos: sirve de tendencia (no se filtra por
  // semana, queda como contexto) y de fuente de opciones del selector.
  const semanasDisponibles = useMemo(() => [...(datos?.porSemana ?? [])].reverse(), [datos])

  const porSemana = useMemo(
    () => (datos ? datos.porSemana.slice(-12).map((s) => ({ etiqueta: `S${s.semana}`, casos: s.casos })) : []),
    [datos],
  )

  const conteoEstado = useMemo(() => {
    const map = new Map(datos?.porEstado.map((e) => [e.estado, e.casos]) ?? [])
    return {
      abierto: map.get('ABIERTO') ?? 0,
      cerrado: map.get('CERRADO') ?? 0,
    }
  }, [datos])

  const estaSemana = datos?.porSemana.at(-1)?.casos ?? 0
  const total = useMemo(() => porGravedad.reduce((acc, g) => acc + g.casos, 0), [porGravedad])

  function cambiarFiltroSemana(valor: string) {
    if (!valor) {
      setFiltroSemana(null)
      return
    }
    const [anio, semana] = valor.split('-').map(Number)
    setFiltroSemana({ anio, semana })
  }

  if (!datos) return <p className="text-sm text-neutral-500">Cargando...</p>

  return (
    <div>
      {opcionesTipo.length > 1 && (
        <div className="inline-flex rounded-lg border border-neutral-200 p-1 bg-neutral-50 mb-4">
          {opcionesTipo.map((op, i) => (
            <button
              key={op.label}
              type="button"
              onClick={() => setIndiceTipo(i)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                indiceTipo === i ? 'bg-white text-brand shadow-sm' : 'text-neutral-500',
              )}
            >
              {op.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <PageHeader
          title={titulo}
          description={`${total} registros ${filtroSemana ? `en la semana ${filtroSemana.semana} (${filtroSemana.anio})` : 'en total'}`}
        />
        <div className="flex items-center gap-2">
          <CalendarRange className="size-4 text-neutral-400" />
          <select
            value={filtroSemana ? `${filtroSemana.anio}-${filtroSemana.semana}` : ''}
            onChange={(e) => cambiarFiltroSemana(e.target.value)}
            disabled={cargando}
            className="input w-auto min-w-[11rem]"
          >
            <option value="">Todas las semanas</option>
            {semanasDisponibles.map((s) => (
              <option key={`${s.anio}-${s.semana}`} value={`${s.anio}-${s.semana}`}>
                Semana {s.semana} · {s.anio}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatTile
          variant="gradient"
          label="Total de casos"
          value={total}
          icon={<ClipboardList className="size-5" />}
          accent={PURPLE}
          sparkline={porSemana.map((s) => ({ valor: s.casos }))}
        />
        <StatTile
          variant="gradient"
          label="Pendientes"
          value={conteoEstado.abierto}
          icon={<Clock className="size-5" />}
          accent={BLUE}
        />
        <StatTile
          variant="gradient"
          label="Cerrados"
          value={conteoEstado.cerrado}
          icon={<CheckCircle2 className="size-5" />}
          accent={ESTADO_COLORES.CERRADO}
        />
        <StatTile variant="gradient" label="Esta semana" value={estaSemana} icon={<TrendingUp className="size-5" />} accent="#fabd49" />
      </div>

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-3 mb-6">
        <CardSection title="Total de casos por semana" className="xl:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={porSemana} margin={{ top: 24, right: 8 }}>
              <defs>
                <linearGradient id="gradSemana" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BLUE} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={PURPLE} stopOpacity={0.03} />
                </linearGradient>
                <linearGradient id="lineaSemana" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={BLUE} />
                  <stop offset="100%" stopColor={PURPLE} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRIS_EJE} vertical={false} />
              <XAxis dataKey="etiqueta" tick={{ fontSize: 11, fill: '#737373' }} axisLine={{ stroke: GRIS_EJE }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} width={32} />
              <Tooltip content={ChartTooltip} cursor={{ stroke: GRIS_EJE }} />
              <Area
                type="monotone"
                dataKey="casos"
                name="Casos"
                stroke="url(#lineaSemana)"
                strokeWidth={2.5}
                fill="url(#gradSemana)"
                dot={{ r: 3, fill: BLUE, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: PURPLE, stroke: '#fff', strokeWidth: 2 }}
                label={EtiquetaValorPunto}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardSection>

        <CardSection title="Top responsables" icon={<Award className="size-4 text-brand" />}>
          {topResponsables.length === 0 ? (
            <p className="text-sm text-neutral-400">Sin datos todavía</p>
          ) : (
            <div className="space-y-4">
              {topResponsables.map((r, i) => (
                <div key={r.responsable}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="flex items-center justify-center size-5 rounded-full bg-navy-soft text-navy text-[11px] font-bold shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm text-neutral-700 truncate">{r.responsable}</span>
                    </span>
                    <span className="text-sm font-semibold text-neutral-900 shrink-0">{r.total}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${r.pct}%`, background: `linear-gradient(90deg, ${BLUE}, ${PURPLE})` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardSection>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <CardSection title="Intervenciones por Zona">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Tooltip content={ChartTooltip} />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
              <Pie
                data={porZona}
                dataKey="casos"
                nameKey="zona"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                strokeWidth={2}
                stroke="#fff"
                label={EtiquetaValorPie}
                labelLine={false}
              >
                {porZona.map((entry, i) => (
                  <Cell key={entry.zona} fill={PALETA_ZONA[i % PALETA_ZONA.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </CardSection>

        <CardSection title="Intervenciones por gravedad">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Tooltip content={ChartTooltip} />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
              <Pie
                data={porGravedad}
                dataKey="casos"
                nameKey="gravedad"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                strokeWidth={2}
                stroke="#fff"
                label={EtiquetaValorPie}
                labelLine={false}
              >
                {porGravedad.map((entry) => (
                  <Cell key={entry.gravedad} fill={GRAVEDAD_COLORES[entry.gravedad as keyof typeof GRAVEDAD_COLORES]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </CardSection>

        <CardSection title="Gravedad por Zona" className="md:col-span-2">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={porZonaGravedad} margin={{ top: 8 }}>
              <CartesianGrid stroke={GRIS_EJE} vertical={false} />
              <XAxis dataKey="zona" tick={{ fontSize: 12, fill: '#737373' }} axisLine={{ stroke: GRIS_EJE }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#737373' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={ChartTooltip} cursor={{ fill: '#f5f5f5' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="plainline" itemSorter={null} />
              <Bar dataKey="BAJO" name="Bajo" stackId="g" fill={GRAVEDAD_COLORES.BAJO} stroke="#fff" strokeWidth={2} maxBarSize={60} label={EtiquetaValorBarra} />
              <Bar dataKey="MEDIO" name="Medio" stackId="g" fill={GRAVEDAD_COLORES.MEDIO} stroke="#fff" strokeWidth={2} maxBarSize={60} label={EtiquetaValorBarra} />
              <Bar
                dataKey="ALTO"
                name="Alto"
                stackId="g"
                fill={GRAVEDAD_COLORES.ALTO}
                stroke="#fff"
                strokeWidth={2}
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
                label={EtiquetaValorBarra}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardSection>
      </div>
    </div>
  )
}
