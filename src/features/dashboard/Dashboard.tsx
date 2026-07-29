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
import type { TooltipContentProps } from 'recharts'
import {
  obtenerReportesDashboard,
  type CasosPorGravedad,
  type CasosPorResponsableGravedad,
  type CasosPorZona,
  type CasosPorEstado,
  type CasosPorSemana,
} from '@/lib/reportesApi'
import { CardSection } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatTile } from '@/components/ui/StatTile'
import { GRAVEDAD_COLORES, ESTADO_COLORES } from '@/components/ui/Badge'
import { ClipboardList, Clock, CheckCircle2, TrendingUp, Award } from 'lucide-react'
import type { TipoRegistro } from '@/types'

// Reemplaza la hoja "INDICADOR" del Excel: casos por zona, por gravedad, y
// cruce responsable x gravedad. Los totales se calculan en Supabase (vistas
// v_casos_por_*), no trayendo todas las atenciones al navegador.

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

// Un solo componente reusado por las 3 rutas de Dashboard (Atenciones/
// Cosecha/360 Laboral, ver App.tsx): cada una pasa su propio tipoRegistro,
// las vistas de reportes ya filtran en el servidor por esa columna.
export function Dashboard({ tipoRegistro, titulo }: { tipoRegistro: TipoRegistro; titulo: string }) {
  const [datos, setDatos] = useState<Datos | null>(null)

  useEffect(() => {
    setDatos(null)
    void obtenerReportesDashboard(tipoRegistro).then(({ porZona, porGravedad, porResponsableGravedad, porEstado, porSemana }) => {
      setDatos({ porZona, porGravedad, porResponsableGravedad, porEstado, porSemana })
    })
  }, [tipoRegistro])

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

  const porSemana = useMemo(() => {
    if (!datos) return []
    // Últimas 12 semanas con datos, para que el sparkline no se vea abarrotado.
    return datos.porSemana.slice(-12).map((s) => ({ etiqueta: `S${s.semana}`, casos: s.casos }))
  }, [datos])

  const conteoEstado = useMemo(() => {
    const map = new Map(datos?.porEstado.map((e) => [e.estado, e.casos]) ?? [])
    return {
      abierto: map.get('ABIERTO') ?? 0,
      cerrado: map.get('CERRADO') ?? 0,
    }
  }, [datos])

  const estaSemana = porSemana.at(-1)?.casos ?? 0
  const total = useMemo(() => porGravedad.reduce((acc, g) => acc + g.casos, 0), [porGravedad])

  if (!datos) return <p className="text-sm text-neutral-500">Cargando...</p>

  return (
    <div>
      <PageHeader title={titulo} description={`${total} registros en total`} />

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
            <AreaChart data={porSemana} margin={{ top: 8, right: 8 }}>
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
        <CardSection title="Casos por zona">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Tooltip content={ChartTooltip} />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
              <Pie data={porZona} dataKey="casos" nameKey="zona" innerRadius={55} outerRadius={85} paddingAngle={2} strokeWidth={2} stroke="#fff">
                {porZona.map((entry, i) => (
                  <Cell key={entry.zona} fill={PALETA_ZONA[i % PALETA_ZONA.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </CardSection>

        <CardSection title="Casos por gravedad">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Tooltip content={ChartTooltip} />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
              <Pie data={porGravedad} dataKey="casos" nameKey="gravedad" innerRadius={55} outerRadius={85} paddingAngle={2} strokeWidth={2} stroke="#fff">
                {porGravedad.map((entry) => (
                  <Cell key={entry.gravedad} fill={GRAVEDAD_COLORES[entry.gravedad as keyof typeof GRAVEDAD_COLORES]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </CardSection>

        <CardSection title="Responsable × gravedad" className="md:col-span-2">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={porResponsable} margin={{ top: 8 }}>
              <CartesianGrid stroke={GRIS_EJE} vertical={false} />
              <XAxis dataKey="responsable" tick={{ fontSize: 12, fill: '#737373' }} axisLine={{ stroke: GRIS_EJE }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#737373' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={ChartTooltip} cursor={{ fill: '#f5f5f5' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="plainline" itemSorter={null} />
              <Bar dataKey="BAJO" name="Bajo" stackId="g" fill={GRAVEDAD_COLORES.BAJO} stroke="#fff" strokeWidth={2} maxBarSize={40} />
              <Bar dataKey="MEDIO" name="Medio" stackId="g" fill={GRAVEDAD_COLORES.MEDIO} stroke="#fff" strokeWidth={2} maxBarSize={40} />
              <Bar dataKey="ALTO" name="Alto" stackId="g" fill={GRAVEDAD_COLORES.ALTO} stroke="#fff" strokeWidth={2} radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </CardSection>
      </div>
    </div>
  )
}
