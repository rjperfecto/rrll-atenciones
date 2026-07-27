import type { ReactNode } from 'react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/cn'
import { Card } from './Card'

// Tarjeta KPI: valor grande (headline number) + etiqueta + acento de color
// opcional a la izquierda. El acento es semántico (mismo tono que los badges
// de Estado/Gravedad), nunca decorativo. El sparkline (si se pasa) grafica
// una tendencia real ya calculada por quien usa el componente — nunca datos
// inventados solo para "verse lleno".
export function StatTile({
  label,
  value,
  icon,
  accent,
  sparkline,
  className,
}: {
  label: string
  value: string | number
  icon?: ReactNode
  accent?: string
  sparkline?: { valor: number }[]
  className?: string
}) {
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
