import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
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
import { ClipboardList, Clock, RefreshCw, CheckCircle2 } from 'lucide-react'

// Reemplaza la hoja "INDICADOR" del Excel: casos por zona, por gravedad, y
// cruce responsable x gravedad. Los totales se calculan en Supabase (vistas
// v_casos_por_*), no trayendo todas las atenciones al navegador.

const GRIS_EJE = '#e5e7eb' // neutral-200: gridlines recesivas, nunca protagonistas
const BRAND = '#166534'

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

export function Dashboard() {
  const [datos, setDatos] = useState<Datos | null>(null)

  useEffect(() => {
    void obtenerReportesDashboard().then(({ porZona, porGravedad, porResponsableGravedad, porEstado, porSemana }) => {
      setDatos({ porZona, porGravedad, porResponsableGravedad, porEstado, porSemana })
    })
  }, [])

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

  const porSemana = useMemo(() => {
    if (!datos) return []
    // Últimas 12 semanas con datos, para que el sparkline no se vea abarrotado.
    return datos.porSemana.slice(-12).map((s) => ({ etiqueta: `S${s.semana}`, casos: s.casos }))
  }, [datos])

  const conteoEstado = useMemo(() => {
    const map = new Map(datos?.porEstado.map((e) => [e.estado, e.casos]) ?? [])
    return {
      abierto: map.get('ABIERTO') ?? 0,
      enProceso: map.get('EN_PROCESO') ?? 0,
      cerrado: map.get('CERRADO') ?? 0,
    }
  }, [datos])

  const total = useMemo(() => porGravedad.reduce((acc, g) => acc + g.casos, 0), [porGravedad])

  if (!datos) return <p className="text-sm text-neutral-500">Cargando...</p>

  return (
    <div>
      <PageHeader title="Dashboard" description={`${total} atenciones registradas en total`} />

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 mb-6">
        <StatTile label="Total de casos" value={total} icon={<ClipboardList className="size-4" />} accent={BRAND} />
        <StatTile label="Abiertos" value={conteoEstado.abierto} icon={<Clock className="size-4" />} accent={ESTADO_COLORES.ABIERTO} />
        <StatTile label="En proceso" value={conteoEstado.enProceso} icon={<RefreshCw className="size-4" />} accent={ESTADO_COLORES.EN_PROCESO} />
        <StatTile label="Cerrados" value={conteoEstado.cerrado} icon={<CheckCircle2 className="size-4" />} accent={ESTADO_COLORES.CERRADO} />
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <CardSection title="Casos por semana" className="md:col-span-2">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={porSemana} margin={{ top: 8, right: 8 }}>
              <CartesianGrid stroke={GRIS_EJE} vertical={false} />
              <XAxis dataKey="etiqueta" tick={{ fontSize: 11, fill: '#737373' }} axisLine={{ stroke: GRIS_EJE }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} width={32} />
              <Tooltip content={ChartTooltip} cursor={{ stroke: GRIS_EJE }} />
              <Area
                type="monotone"
                dataKey="casos"
                name="Casos"
                stroke={BRAND}
                strokeWidth={2}
                fill={BRAND}
                fillOpacity={0.1}
                dot={{ r: 3, fill: BRAND, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: BRAND, stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardSection>

        <CardSection title="Casos por zona">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={porZona} margin={{ top: 16 }}>
              <CartesianGrid stroke={GRIS_EJE} vertical={false} />
              <XAxis dataKey="zona" tick={{ fontSize: 12, fill: '#737373' }} axisLine={{ stroke: GRIS_EJE }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#737373' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={ChartTooltip} cursor={{ fill: '#f5f5f5' }} />
              <Bar dataKey="casos" name="Casos" fill={BRAND} radius={[4, 4, 0, 0]} maxBarSize={40}>
                <LabelList dataKey="casos" position="top" style={{ fontSize: 11, fill: '#525252' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardSection>

        <CardSection title="Casos por gravedad">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={porGravedad} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid stroke={GRIS_EJE} horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#737373' }} axisLine={{ stroke: GRIS_EJE }} tickLine={false} />
              <YAxis type="category" dataKey="gravedad" tick={{ fontSize: 12, fill: '#737373' }} axisLine={false} tickLine={false} width={60} />
              <Tooltip content={ChartTooltip} cursor={{ fill: '#f5f5f5' }} />
              <Bar dataKey="casos" name="Casos" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {porGravedad.map((entry) => (
                  <Cell key={entry.gravedad} fill={GRAVEDAD_COLORES[entry.gravedad as keyof typeof GRAVEDAD_COLORES]} />
                ))}
                <LabelList dataKey="casos" position="right" style={{ fontSize: 11, fill: '#525252' }} />
              </Bar>
            </BarChart>
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
