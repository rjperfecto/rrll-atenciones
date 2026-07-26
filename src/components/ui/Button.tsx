import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
}

// Primario = única acción "hacia adelante" de una pantalla o widget (Registrar,
// Buscar). Secundario = acción alterna/menos frecuente (Escanear, Limpiar,
// Cancelar): outline con texto navy, nunca compite en peso visual con el primario.
const VARIANTES: Record<Variant, string> = {
  primary: 'bg-brand text-white shadow-sm hover:bg-brand-light active:bg-brand disabled:hover:bg-brand',
  secondary: 'border border-neutral-300 text-navy bg-white hover:bg-neutral-50 hover:border-navy/40',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-brand hover:bg-brand/10',
}

// Botón único para toda la app: variantes consistentes + estado de carga con
// spinner incorporado, para no repetir className y estados hover/disabled
// distintos en cada pantalla. min-h-11 (44px) para uso táctil en campo.
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', loading = false, disabled, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 min-h-11 rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
        VARIANTES[variant],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
})
