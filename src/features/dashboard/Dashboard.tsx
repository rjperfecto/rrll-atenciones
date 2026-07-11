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
import { CardSection } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { GRAVEDAD_COLORES } from '@/components/ui/Badge'

// Reemplaza la hoja "INDICADOR" del Excel: casos por zona, por gravedad,
// y cruce responsable x gravedad, calculados en vivo sobre los datos locales.

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
    <div>
      <PageHeader title="Dashboard" description={`${atenciones.length} atenciones registradas en total`} />
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <CardSection title="Casos por zona">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={porZona}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="zona" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="casos" fill="#166534" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardSection>

        <CardSection title="Casos por gravedad">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={porGravedad} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="gravedad" tick={{ fontSize: 12 }} width={60} />
              <Tooltip />
              <Bar dataKey="casos" radius={[0, 4, 4, 0]}>
                {porGravedad.map((entry) => (
                  <Cell key={entry.gravedad} fill={GRAVEDAD_COLORES[entry.gravedad as keyof typeof GRAVEDAD_COLORES]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardSection>

        <CardSection title="Responsable × gravedad" className="md:col-span-2">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={porResponsable}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="responsable" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="BAJO" stackId="g" fill={GRAVEDAD_COLORES.BAJO} />
              <Bar dataKey="MEDIO" stackId="g" fill={GRAVEDAD_COLORES.MEDIO} />
              <Bar dataKey="ALTO" stackId="g" fill={GRAVEDAD_COLORES.ALTO} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardSection>
      </div>
    </div>
  )
}
