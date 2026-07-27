import type { ReactNode } from 'react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/cn'
import { Card } from './Card'

// Tarjeta KPI: valor grande (headline number) + etiqueta + acento de color
// opcional a la izquierda. El acento es semántico (mismo tono que los badges
// de Estado/Gravedad), nunca decorativo. El sparkline (si se pasa) grafica
// una tendencia real ya calculada por quien usa el componente — nunca datos
// inventados solo para "verse lleno".
//
// variant "gradient": tarjeta "hero" con degradado de color sólido y texto
// blanco (estilo panel admin), reservada para las 1-2 métricas más
// importantes de una pantalla; "flat" (por defecto) es la tarjeta blanca
// discreta usada para el resto.
export function StatTile({
  label,
  value,
  icon,
  accent,
  sparkline,
  variant = 'flat',
  className,
}: {
  label: string
  value: string | number
  icon?: ReactNode
  accent?: string
  sparkline?: { valor: number }[]
  variant?: 'flat' | 'gradient'
  className?: string
}) {
  if (variant === 'gradient') {
    return (
      <Card
        className={cn('p-5 text-white border-0 shadow-lg overflow-hidden relative', className)}
        style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white/80">{label}</p>
            <p className="text-3xl font-bold leading-tight mt-1">{value}</p>
          </div>
          {icon && (
            <span className="flex items-center justify-center size-11 rounded-xl bg-white/20 shrink-0">
              {icon}
            </span>
          )}
        </div>
        {sparkline && sparkline.length > 1 && (
          <div className="w-full h-10 mt-3 -mb-2 opacity-90">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkline}>
                <Area type="monotone" dataKey="valor" stroke="#fff" strokeWidth={1.5} fill="#fff" fillOpacity={0.25} isAnimationActive={false} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    )
  }

  return (
    <Card className={cn('p-4 flex items-center gap-3', className)}>
      {icon && (
        <span
          className="flex items-center justify-center size-11 rounded-xl shrink-0 text-white"
          style={{ backgroundColor: accent, boxShadow: accent ? `0 6px 14px -2px ${accent}66` : undefined }}
        >
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-semibold text-neutral-900 leading-tight">{value}</p>
        <p className="text-xs text-neutral-500 truncate">{label}</p>
      </div>
      {sparkline && sparkline.length > 1 && (
        <div className="w-16 h-9 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkline}>
              <Area
                type="monotone"
                dataKey="valor"
                stroke={accent}
                strokeWidth={1.5}
                fill={accent}
                fillOpacity={0.15}
                isAnimationActive={false}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
