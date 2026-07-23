import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Card } from './Card'

// Tarjeta KPI: valor grande (headline number) + etiqueta + acento de color
// opcional a la izquierda. El acento es semántico (mismo tono que los badges
// de Estado/Gravedad), nunca decorativo.
export function StatTile({
  label,
  value,
  icon,
  accent,
  className,
}: {
  label: string
  value: string | number
  icon?: ReactNode
  accent?: string
  className?: string
}) {
  return (
    <Card className={cn('p-4 flex items-center gap-3', className)}>
      {icon && (
        <span
          className="flex items-center justify-center size-9 rounded-full shrink-0"
          style={{ backgroundColor: accent ? `${accent}1a` : undefined, color: accent }}
        >
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <p className="text-2xl font-semibold text-neutral-900 leading-tight">{value}</p>
        <p className="text-xs text-neutral-500 truncate">{label}</p>
      </div>
    </Card>
  )
}
