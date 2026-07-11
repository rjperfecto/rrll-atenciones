import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { estadoDeCampo, CLASE_INPUT_POR_ESTADO } from '@/lib/campoEstado'

// Envuelve label + control + ícono/mensaje de estado, calculando solo si el
// campo está: lleno y válido (verde), obligatorio vacío recién tocado/tras
// enviar (ámbar), con error de formato (rojo), u opcional vacío (neutro) —
// ver src/lib/campoEstado.ts. Antes cada input repetía esta estructura a
// mano ~25 veces sin feedback visual de éxito/obligatoriedad.
export function Field({
  label,
  value,
  error,
  hint,
  className,
  children,
}: {
  label: string
  value?: unknown
  error?: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  const hijo = Children.only(children)
  // Un campo deshabilitado (ej. Subcategoría antes de elegir Categoría) no
  // debe mostrarse en advertencia/error: el usuario todavía no puede
  // completarlo, así que resaltarlo como "pendiente" sería confuso.
  const deshabilitado = isValidElement(hijo) && Boolean((hijo.props as { disabled?: boolean }).disabled)
  const estado = deshabilitado ? 'neutral' : estadoDeCampo(value, error)
  const claseEstado = CLASE_INPUT_POR_ESTADO[estado]
  const conIcono = estado !== 'neutral'
  const esTextarea = isValidElement(hijo) && hijo.type === 'textarea'
  const hijoConEstado =
    isValidElement(hijo) &&
    cloneElement(hijo as ReactElement<{ className?: string }>, {
      className: cn((hijo.props as { className?: string }).className, claseEstado, conIcono && 'pl-9'),
    })

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>
      <div className="relative">
        {hijoConEstado}
        {conIcono && (
          <span className={cn('absolute left-3 pointer-events-none', esTextarea ? 'top-3' : 'top-1/2 -translate-y-1/2')}>
            {estado === 'success' && <CheckCircle2 className="size-4 text-success" />}
            {estado === 'warning' && <AlertTriangle className="size-4 text-warning" />}
            {estado === 'error' && <AlertCircle className="size-4 text-danger" />}
          </span>
        )}
      </div>
      {estado === 'warning' && error && <p className="text-xs text-warning mt-1">{error}</p>}
      {estado === 'error' && error && <p className="text-xs text-danger mt-1">{error}</p>}
      {estado !== 'warning' && estado !== 'error' && hint && <p className="text-xs text-neutral-500 mt-1">{hint}</p>}
    </div>
  )
}
