import { AlertCircle, FileText } from 'lucide-react'
import { CardSection } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import type { PlantillaPdf } from '@/types'

// Selector de plantilla compartido entre Documento individual y masivo: se
// pidió sacar esto a un solo lugar para no repetir el mismo bloque (y el
// mismo aviso de "sin posiciones configuradas") en los dos.
export function SelectorPlantilla({
  plantillas,
  plantillaId,
  onChange,
}: {
  plantillas: PlantillaPdf[] | null
  plantillaId: string
  onChange: (id: string) => void
}) {
  const plantilla = plantillas?.find((p) => p.id === plantillaId) ?? null
  const incompleta = plantilla !== null && plantilla.posiciones.length === 0

  return (
    <CardSection title="Plantilla" icon={<FileText className="size-4 text-brand" />}>
      {plantillas === null ? (
        <p className="text-sm text-neutral-400">Cargando plantillas...</p>
      ) : plantillas.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Todavía no hay plantillas cargadas. Pídele a un ADMIN que suba una en Administración &gt; Plantillas PDF.
        </p>
      ) : (
        <Field label="Elige la plantilla">
          <select value={plantillaId} onChange={(e) => onChange(e.target.value)} className="input">
            <option value="">Selecciona...</option>
            {plantillas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </Field>
      )}
      {incompleta && (
        <p className="text-xs text-amber-600 flex items-center gap-1.5">
          <AlertCircle className="size-3.5 shrink-0" />
          Esta plantilla todavía no tiene ningún campo configurado (Administración &gt; Plantillas PDF).
        </p>
      )}
    </CardSection>
  )
}
