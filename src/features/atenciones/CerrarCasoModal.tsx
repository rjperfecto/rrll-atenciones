import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cierreSchema, type CierreFormValues } from './cierreSchema'
import { ACCIONES_CORRECTIVAS, requiereDias } from '@/data/accionCorrectiva'
import { db } from '@/lib/db'
import { pushPending } from '@/lib/sync'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import type { Atencion } from '@/types'

export function CerrarCasoModal({ atencion, onClose }: { atencion: Atencion; onClose: () => void }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CierreFormValues>({ resolver: zodResolver(cierreSchema), mode: 'onTouched' })

  const valores = watch()
  const accionCorrectiva = valores.accionCorrectiva

  async function onSubmit(values: CierreFormValues) {
    const now = new Date().toISOString()
    await db.atenciones.update(atencion.id, {
      estado: 'CERRADO',
      accion_correctiva: values.accionCorrectiva,
      dias_suspension: values.accionCorrectiva === 'SUSPENSIÓN' ? (values.diasSuspension ?? null) : null,
      detalle_cierre: values.detalleCierre || null,
      fecha_cierre: now.slice(0, 10),
      updated_at: now,
      synced: false,
    })
    void pushPending()
    onClose()
  }

  return (
    <Modal
      title="Cerrar caso"
      description={`${atencion.involucrados[0]?.nombre_completo ?? ''} · ${atencion.subcategoria}`}
      onClose={onClose}
    >
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
