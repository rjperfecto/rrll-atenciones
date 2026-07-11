import type { ReactNode } from 'react'
import { X } from 'lucide-react'

// Modal genérico (fondo + cierre por click afuera + botón X) para no repetir
// el overlay/posicionamiento en cada pantalla que necesite uno.
export function Modal({
  title,
  description,
  onClose,
  children,
}: {
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="text-neutral-400 hover:text-neutral-600 -mt-1 -mr-1 p-1"
          >
            <X className="size-4" />
          </button>
        </div>
        {description && <p className="text-sm text-neutral-500 mb-4">{description}</p>}
        {children}
      </div>
    </div>
  )
}
