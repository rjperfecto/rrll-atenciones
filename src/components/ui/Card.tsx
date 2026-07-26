import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

// Contenedor visual único (borde + sombra + radio) usado en toda la app
// (listas, gráficos, modales) para que la jerarquía visual sea consistente.
export function Card({ className, children, id }: { className?: string; children: ReactNode; id?: string }) {
  return <div id={id} className={cn('rounded-xl border border-neutral-100 bg-white shadow-sm', className)}>{children}</div>
}

export function CardSection({
  title,
  icon,
  children,
  className,
  id,
}: {
  title: string
  icon?: ReactNode
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <Card id={id} className={cn('p-4 sm:p-5 space-y-4 scroll-mt-24', className)}>
      <h3 className="flex items-center gap-2 text-base font-semibold text-navy">
        {icon}
        {title}
      </h3>
      {children}
    </Card>
  )
}
