import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
}

const VARIANTES: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-light disabled:hover:bg-brand',
  secondary: 'border border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-brand hover:bg-brand/10',
}

// Botón único para toda la app: variantes consistentes + estado de carga con
// spinner incorporado, para no repetir className y estados hover/disabled
// distintos en cada pantalla.
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', loading = false, disabled, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
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
