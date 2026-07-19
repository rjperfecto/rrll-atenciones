import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, History } from 'lucide-react'
import { cierreSchema, type CierreFormValues } from './cierreSchema'
import { ACCIONES_CORRECTIVAS, requiereDias } from '@/data/accionCorrectiva'
import { cerrarCasoAtencion, buscarAntecedentesPorLegajo, type AntecedenteFalta } from '@/lib/atencionesApi'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { GravedadBadge } from '@/components/ui/Badge'
import type { Atencion } from '@/types'

export function CerrarCasoModal({ atencion, onClose }: { atencion: Atencion; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const [antecedentes, setAntecedentes] = useState<AntecedenteFalta[] | null>(null)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CierreFormValues>({ resolver: zodResolver(cierreSchema), mode: 'onTouched' })

  const valores = watch()
  const accionCorrectiva = valores.accionCorrectiva
  const legajo = atencion.involucrados[0]?.legajo

  useEffect(() => {
    if (!legajo) {
      setAntecedentes([])
      return
    }
    void buscarAntecedentesPorLegajo(legajo, atencion.id).then(setAntecedentes)
  }, [legajo, atencion.id])

  async function onSubmit(values: CierreFormValues) {
    setError(null)
    const now = new Date().toISOString()
    const { error: err } = await cerrarCasoAtencion(atencion.id, {
      estado: 'CERRADO',
      accion_correctiva: values.accionCorrectiva,
      dias_suspension: values.accionCorrectiva === 'SUSPENSIÓN' ? (values.diasSuspension ?? null) : null,
      detalle_cierre: values.detalleCierre || null,
      fecha_cierre: now.slice(0, 10),
      updated_at: now,
    })
    if (err) {
      setError(`No se pudo cerrar el caso: ${err}`)
      return
    }
    onClose()
  }

  return (
    <Modal
      title="Cerrar caso"
      description={`${atencion.involucrados[0]?.nombre_completo ?? ''} · ${atencion.subcategoria}`}
      onClose={onClose}
      size="lg"
    >
      <div className="mb-4 rounded-md border border-neutral-200 bg-neutral-50 p-3">
        <p className="text-sm font-medium text-neutral-800 flex items-center gap-1.5 mb-1">
          <History className="size-4 text-brand" />
          ANTECEDENTES
        </p>
        {antecedentes === null ? (
          <p className="text-sm text-neutral-500">Buscando antecedentes del legajo...</p>
        ) : antecedentes.length === 0 ? (
          <p className="text-sm text-neutral-500">Sin faltas previas registradas para este legajo.</p>
        ) : (
          <>
            <p className="text-sm text-neutral-700 mb-2">
              {antecedentes.length} falta{antecedentes.length > 1 ? 's' : ''} previa{antecedentes.length > 1 ? 's' : ''} registrada{antecedentes.length > 1 ? 's' : ''} para este legajo:
            </p>
            <ul className="space-y-1 max-h-40 overflow-y-auto">
              {antecedentes.map((a, i) => (
                <li key={i} className="text-sm text-neutral-600 flex items-center gap-2">
                  <span className="text-neutral-400">{a.fecha}</span>
                  <span className="flex-1">{a.subcategoria}</span>
                  <GravedadBadge gravedad={a.gravedad} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Acción correctiva" value={accionCorrectiva} error={errors.accionCorrectiva?.message}>
          <select {...register('accionCorrectiva')} className="input">
            <option value="">Selecciona...</option>
            {ACCIONES_CORRECTIVAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </Field>

        {requiereDias(accionCorrectiva || '') && (
          <Field label="Días de suspensión" value={valores.diasSuspension} error={errors.diasSuspension?.message}>
            <input type="number" min={1} {...register('diasSuspension', { valueAsNumber: true })} className="input" />
          </Field>
        )}

        <Field label="Detalle del cierre (opcional)" value={valores.detalleCierre}>
          <input type="text" {...register('detalleCierre')} className="input" />
        </Field>

        {error && (
          <p className="text-sm text-danger flex items-center gap-1.5">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isSubmitting ? 'Cerrando...' : 'Confirmar cierre'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
