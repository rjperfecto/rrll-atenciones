import { cn } from '@/lib/cn'
import type { Estado } from '@/types'
import type { Gravedad } from '@/data/categorizacion'

// Colores de Gravedad/Estado centralizados: antes había un mapa idéntico
// copiado en AtencionForm, AtencionList y Dashboard, con riesgo de que se
// desincronizaran (ej. cambiar un color en un lado y no en otro).
export const GRAVEDAD_COLORES: Record<Gravedad, string> = {
  BAJO: '#10b981',
  MEDIO: '#f59e0b',
  ALTO: '#ef4444',
}

const GRAVEDAD_CLASES: Record<Gravedad, string> = {
  BAJO: 'bg-emerald-100 text-emerald-800',
  MEDIO: 'bg-amber-100 text-amber-800',
  ALTO: 'bg-red-100 text-red-800',
}

const ESTADO_CLASES: Record<Estado, string> = {
  ABIERTO: 'bg-neutral-100 text-neutral-700',
  EN_PROCESO: 'bg-blue-100 text-blue-800',
  CERRADO: 'bg-neutral-200 text-neutral-500',
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap', className)}>
      {children}
    </span>
  )
}

export function GravedadBadge({ gravedad }: { gravedad: Gravedad }) {
  return <Badge className={GRAVEDAD_CLASES[gravedad]}>{gravedad}</Badge>
}

export function EstadoBadge({ estado }: { estado: Estado }) {
  return <Badge className={ESTADO_CLASES[estado]}>{estado.replace('_', ' ')}</Badge>
}
