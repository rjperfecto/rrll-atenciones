import { CheckCircle2, Clock, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Estado } from '@/types'
import type { Gravedad } from '@/data/categorizacion'

// Colores de Gravedad/Estado centralizados: antes había un mapa idéntico
// copiado en AtencionForm, AtencionList y Dashboard, con riesgo de que se
// desincronizaran (ej. cambiar un color en un lado y no en otro). Usan los
// mismos tokens semánticos (success/warning/danger) que los estados de
// campo de los formularios, ver src/index.css.
export const GRAVEDAD_COLORES: Record<Gravedad, string> = {
  BAJO: '#10b981',
  MEDIO: '#f59e0b',
  ALTO: '#ef4444',
}

const GRAVEDAD_CLASES: Record<Gravedad, string> = {
  BAJO: 'bg-success-soft text-emerald-800',
  MEDIO: 'bg-warning-soft text-amber-800',
  ALTO: 'bg-danger-soft text-red-800',
}

// Mapeo de estado -> color e ícono semántico:
// CERRADO (finalizado) = éxito/verde, ABIERTO (pendiente de cierre) =
// advertencia/ámbar, EN_PROCESO (en curso) = informativo/azul.
const ESTADO_CLASES: Record<Estado, string> = {
  ABIERTO: 'bg-warning-soft text-amber-800',
  EN_PROCESO: 'bg-blue-100 text-blue-800',
  CERRADO: 'bg-success-soft text-emerald-800',
}

const ESTADO_ICONOS: Record<Estado, typeof Clock> = {
  ABIERTO: Clock,
  EN_PROCESO: RefreshCw,
  CERRADO: CheckCircle2,
}

const ESTADO_ETIQUETAS: Record<Estado, string> = {
  ABIERTO: 'Pendiente',
  EN_PROCESO: 'En proceso',
  CERRADO: 'Cerrado',
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap', className)}>
      {children}
    </span>
  )
}

export function GravedadBadge({ gravedad }: { gravedad: Gravedad }) {
  return <Badge className={GRAVEDAD_CLASES[gravedad]}>{gravedad}</Badge>
}

export function EstadoBadge({ estado }: { estado: Estado }) {
  const Icono = ESTADO_ICONOS[estado]
  return (
    <Badge className={ESTADO_CLASES[estado]}>
      <Icono className="size-3" />
      {ESTADO_ETIQUETAS[estado]}
    </Badge>
  )
}
