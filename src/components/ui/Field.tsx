import type { ReactNode } from 'react'

// Envuelve label + control + mensaje de error/ayuda con espaciado y
// tipografía consistentes, para no repetir esta estructura en cada campo
// de cada formulario (antes copiada ~25 veces solo en AtencionForm).
export function Field({
  label,
  error,
  hint,
  className,
  children,
}: {
  label: string
  error?: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {!error && hint && <p className="text-xs text-neutral-500 mt-1">{hint}</p>}
    </div>
  )
}
