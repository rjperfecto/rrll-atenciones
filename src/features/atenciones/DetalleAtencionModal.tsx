import { Modal } from '@/components/ui/Modal'
import { GravedadBadge, EstadoBadge } from '@/components/ui/Badge'
import type { Atencion } from '@/types'

function Dato({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div>
      <dt className="text-xs text-neutral-500">{label}</dt>
      <dd className="text-sm text-neutral-800">{value}</dd>
    </div>
  )
}

export function DetalleAtencionModal({ atencion, onClose }: { atencion: Atencion; onClose: () => void }) {
  const involucrado = atencion.involucrados[0]

  return (
    <Modal
      title="Detalle de la atención"
      description={`${atencion.fecha} · ${atencion.zona}${atencion.fundo ? ` · ${atencion.fundo}` : ''}`}
      onClose={onClose}
      size="lg"
    >
      <div className="flex items-center gap-2 mb-4">
        <GravedadBadge gravedad={atencion.gravedad} />
        <EstadoBadge estado={atencion.estado} />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Dato label="Nombre completo" value={involucrado?.nombre_completo} />
        <Dato label="DNI" value={involucrado?.dni} />
        <Dato label="Legajo" value={involucrado?.legajo} />
        <Dato
          label="Afiliado sindical"
          value={involucrado?.es_afiliado === null || involucrado?.es_afiliado === undefined ? undefined : involucrado.es_afiliado ? 'Sí' : 'No'}
        />

        <Dato label="Zona" value={atencion.zona} />
        <Dato label="Fundo" value={atencion.fundo} />
        <Dato label="Módulo" value={atencion.modulo} />
        <Dato label="Grupo" value={atencion.grupo} />
        <Dato label="Área" value={atencion.area} />
        <Dato label="Sup. cuadrilla" value={atencion.sup_cuadrilla} />

        <Dato label="Tipo" value={atencion.tipo} />
        <Dato label="Categoría" value={atencion.categoria} />
        <Dato label="Subcategoría" value={atencion.subcategoria} />
        <Dato label="Falta" value={atencion.falta} />
      </dl>

      {(atencion.reporte || atencion.antecedente || atencion.comentarios) && (
        <div className="mt-4 pt-4 border-t border-neutral-200 space-y-3">
          <Dato label="Reporta" value={atencion.reporte} />
          <Dato label="Antecedente" value={atencion.antecedente} />
          <Dato label="Comentarios" value={atencion.comentarios} />
        </div>
      )}

      {atencion.estado === 'CERRADO' && (
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <p className="text-xs font-medium text-neutral-500 mb-2">Cierre del caso</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Dato label="Fecha de cierre" value={atencion.fecha_cierre} />
            <Dato label="Acción correctiva" value={atencion.accion_correctiva} />
            <Dato label="Días de suspensión" value={atencion.dias_suspension} />
            <Dato label="Detalle" value={atencion.detalle_cierre} />
          </dl>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-neutral-200">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Dato label="Responsable" value={atencion.responsable_nombre} />
          <Dato label="Sup. RRLL" value={atencion.sup_rrll} />
        </dl>
      </div>
    </Modal>
  )
}
