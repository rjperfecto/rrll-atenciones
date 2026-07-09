import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cierreSchema, type CierreFormValues } from './cierreSchema'
import { ACCIONES_CORRECTIVAS, requiereDias } from '@/data/accionCorrectiva'
import { db } from '@/lib/db'
import { pushPending } from '@/lib/sync'
import type { Atencion } from '@/types'

export function CerrarCasoModal({ atencion, onClose }: { atencion: Atencion; onClose: () => void }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CierreFormValues>({ resolver: zodResolver(cierreSchema) })

  const accionCorrectiva = watch('accionCorrectiva')

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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-5">
        <h3 className="text-base font-semibold text-neutral-900 mb-1">Cerrar caso</h3>
        <p className="text-sm text-neutral-500 mb-4">
          {atencion.involucrados[0]?.nombre_completo} · {atencion.subcategoria}
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Acción correctiva</label>
            <select {...register('accionCorrectiva')} className="input">
              <option value="">Selecciona...</option>
              {ACCIONES_CORRECTIVAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            {errors.accionCorrectiva && <p className="field-error">{errors.accionCorrectiva.message}</p>}
          </div>

          {requiereDias(accionCorrectiva || '') && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Días de suspensión</label>
              <input
                type="number"
                min={1}
                {...register('diasSuspension', { valueAsNumber: true })}
                className="input"
              />
              {errors.diasSuspension && <p className="field-error">{errors.diasSuspension.message}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Detalle del cierre (opcional)</label>
            <input type="text" {...register('detalleCierre')} className="input" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-brand text-white px-4 py-2 text-sm font-medium hover:bg-brand-light disabled:opacity-50"
            >
              {isSubmitting ? 'Cerrando...' : 'Confirmar cierre'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
