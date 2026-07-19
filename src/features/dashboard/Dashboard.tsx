import { useEffect, useMemo, useState } from 'react'
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
import { obtenerReportesDashboard, type CasosPorGravedad, type CasosPorResponsableGravedad, type CasosPorZona } from '@/lib/reportesApi'
import { CardSection } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { GRAVEDAD_COLORES } from '@/components/ui/Badge'

// Reemplaza la hoja "INDICADOR" del Excel: casos por zona, por gravedad, y
// cruce responsable x gravedad. Los totales se calculan en Supabase (vistas
// v_casos_por_*), no trayendo todas las atenciones al navegador.

interface Datos {
  porZona: CasosPorZona[]
  porGravedad: CasosPorGravedad[]
  porResponsableGravedad: CasosPorResponsableGravedad[]
}

export function Dashboard() {
  const [datos, setDatos] = useState<Datos | null>(null)

  useEffect(() => {
    void obtenerReportesDashboard().then(({ porZona, porGravedad, porResponsableGravedad }) => {
      setDatos({ porZona, porGravedad, porResponsableGravedad })
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

  const total = useMemo(() => porGravedad.reduce((acc, g) => acc + g.casos, 0), [porGravedad])

  if (!datos) return <p className="text-sm text-neutral-500">Cargando...</p>

  return (
    <div>
      <PageHeader title="Dashboard" description={`${total} atenciones registradas en total`} />
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
