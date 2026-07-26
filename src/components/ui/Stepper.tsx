import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface PasoStepper {
  id: string
  label: string
  icon: ReactNode
}

// Barra de orientación horizontal (no es un wizard que bloquea avance: todos
// los campos siguen visibles y editables). Resalta en qué sección de la
// pantalla está el usuario (via scroll-spy en quien lo usa) y permite saltar
// a una sección con un clic, para orientarse en un formulario largo en campo.
export function Stepper({ pasos, activo, onIrA }: { pasos: PasoStepper[]; activo: string; onIrA: (id: string) => void }) {
  const indexActivo = pasos.findIndex((p) => p.id === activo)

  return (
    <div className="flex items-center gap-1 overflow-x-auto -mx-1 px-1 pb-1 mb-5" role="tablist" aria-label="Secciones del formulario">
      {pasos.map((paso, i) => {
        const esActivo = paso.id === activo
        const completado = i < indexActivo
        return (
          <button
            key={paso.id}
            type="button"
            role="tab"
            aria-selected={esActivo}
            onClick={() => onIrA(paso.id)}
            className={cn(
              'flex items-center gap-2 shrink-0 rounded-full pl-2 pr-3 py-1.5 text-xs font-medium transition-all duration-200',
              esActivo && 'bg-brand text-white shadow-sm',
              completado && !esActivo && 'text-brand',
              !esActivo && !completado && 'text-neutral-400 hover:text-neutral-600',
            )}
          >
            <span
              className={cn(
                'flex items-center justify-center size-5 rounded-full shrink-0 transition-colors duration-200',
                esActivo && 'bg-white/20',
                completado && !esActivo && 'bg-brand/10',
                !esActivo && !completado && 'bg-neutral-100',
              )}
            >
              {completado && !esActivo ? <Check className="size-3" /> : paso.icon}
            </span>
            <span className="hidden sm:inline whitespace-nowrap">{paso.label}</span>
            {i < pasos.length - 1 && <span className="hidden sm:inline w-3 h-px bg-neutral-200 ml-1" aria-hidden="true" />}
          </button>
        )
      })}
    </div>
  )
}
