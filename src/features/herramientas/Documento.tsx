import { useEffect, useState } from 'react'
import { listarPlantillas } from '@/lib/plantillasApi'
import { DocumentoIndividual } from './DocumentoIndividual'
import { DocumentoMasivo } from './DocumentoMasivo'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/cn'
import type { PlantillaPdf } from '@/types'

type Modo = 'INDIVIDUAL' | 'MASIVO'

// Plantillas se carga acá (no en cada pestaña) para no repetir la consulta
// ni mostrar el spinner de "cargando plantillas" cada vez que se cambia de
// pestaña.
export function Documento() {
  const [modo, setModo] = useState<Modo>('INDIVIDUAL')
  const [plantillas, setPlantillas] = useState<PlantillaPdf[] | null>(null)

  useEffect(() => {
    void listarPlantillas().then(({ data }) => setPlantillas(data))
  }, [])

  return (
    <div className="max-w-xl">
      <PageHeader title="Documento" description="Genera una plantilla PDF con los datos de uno o varios trabajadores." />

      <Card className="p-3 mb-4">
        <div className="inline-flex rounded-lg border border-neutral-200 p-1 bg-neutral-50 self-start">
          <button
            type="button"
            onClick={() => setModo('INDIVIDUAL')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              modo === 'INDIVIDUAL' ? 'bg-white text-brand shadow-sm' : 'text-neutral-500',
            )}
          >
            Documento individual
          </button>
          <button
            type="button"
            onClick={() => setModo('MASIVO')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              modo === 'MASIVO' ? 'bg-white text-brand shadow-sm' : 'text-neutral-500',
            )}
          >
            Documento masivo
          </button>
        </div>
      </Card>

      {modo === 'INDIVIDUAL' ? <DocumentoIndividual plantillas={plantillas} /> : <DocumentoMasivo plantillas={plantillas} />}
    </div>
  )
}
