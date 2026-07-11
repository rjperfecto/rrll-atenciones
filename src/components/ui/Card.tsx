import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

// Contenedor visual único (borde + sombra + radio) usado en toda la app
// (listas, gráficos, modales) para que la jerarquía visual sea consistente.
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-lg border border-neutral-200 bg-white shadow-sm', className)}>{children}</div>
}

export function CardSection({
  title,
  icon,
  children,
  className,
}: {
  title: string
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={cn('p-4 sm:p-5 space-y-4', className)}>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
        {icon}
        {title}
      </h3>
      {children}
    </Card>
  )
}
