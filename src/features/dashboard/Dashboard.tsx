import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { db } from '@/lib/db'

// Reemplaza la hoja "INDICADOR" del Excel: casos por zona, por gravedad,
// y cruce responsable x gravedad, calculados en vivo sobre los datos locales.

const GRAVEDAD_COLORS: Record<string, string> = {
  BAJO: '#10b981',
  MEDIO: '#f59e0b',
  ALTO: '#ef4444',
}

export function Dashboard() {
  const atenciones = useLiveQuery(() => db.atenciones.toArray(), [])

  const porZona = useMemo(() => {
    if (!atenciones) return []
    const counts = new Map<string, number>()
    for (const a of atenciones) counts.set(a.zona, (counts.get(a.zona) ?? 0) + 1)
    return [...counts.entries()].map(([zona, casos]) => ({ zona, casos }))
  }, [atenciones])

  const porGravedad = useMemo(() => {
    if (!atenciones) return []
    const counts = new Map<string, number>()
    for (const a of atenciones) counts.set(a.gravedad, (counts.get(a.gravedad) ?? 0) + 1)
    return [...counts.entries()].map(([gravedad, casos]) => ({ gravedad, casos }))
  }, [atenciones])

  const porResponsable = useMemo(() => {
    if (!atenciones) return []
    const map = new Map<string, { responsable: string; BAJO: number; MEDIO: number; ALTO: number }>()
    for (const a of atenciones) {
      const row = map.get(a.responsable_nombre) ?? {
        responsable: a.responsable_nombre,
        BAJO: 0,
        MEDIO: 0,
        ALTO: 0,
      }
      row[a.gravedad]++
      map.set(a.responsable_nombre, row)
    }
    return [...map.values()]
  }, [atenciones])

  if (!atenciones) return <p className="text-sm text-neutral-500">Cargando...</p>

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ChartCard title={`Casos por zona (${atenciones.length} total)`}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={porZona}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="zona" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="casos" fill="#166534" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Casos por gravedad">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={porGravedad} layout="vertical" margin={{ left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="gravedad" tick={{ fontSize: 12 }} width={60} />
            <Tooltip />
            <Bar dataKey="casos" radius={[0, 4, 4, 0]}>
              {porGravedad.map((entry) => (
                <Cell key={entry.gravedad} fill={GRAVEDAD_COLORS[entry.gravedad]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Responsable × gravedad" className="md:col-span-2">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={porResponsable}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="responsable" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="BAJO" stackId="g" fill={GRAVEDAD_COLORS.BAJO} />
            <Bar dataKey="MEDIO" stackId="g" fill={GRAVEDAD_COLORS.MEDIO} />
            <Bar dataKey="ALTO" stackId="g" fill={GRAVEDAD_COLORS.ALTO} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}

function ChartCard({
  title,
  children,
  className = '',
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-lg border border-neutral-200 bg-white p-4 shadow-sm ${className}`}>
      <h3 className="text-sm font-medium text-neutral-700 mb-2">{title}</h3>
      {children}
    </div>
  )
}
