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
        <span className="text-xs font-medium text-navy bg-navy-soft px-2 py-0.5 rounded-full">{atencion.tipo_registro}</span>
        <GravedadBadge gravedad={atencion.gravedad} />
        <EstadoBadge estado={atencion.estado} />
      </div>

      {atencion.tipo_registro === '360 LABORAL' ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Dato label="Zona" value={atencion.zona} />
          <Dato label="Fundo" value={atencion.zona === 'PACKING' ? undefined : atencion.fundo} />
          <Dato label="Packing" value={atencion.zona === 'PACKING' ? atencion.fundo : undefined} />
          <Dato label="Turno" value={atencion.zona === 'PACKING' ? atencion.modulo : undefined} />
          <Dato label="Módulo" value={atencion.zona === 'PACKING' ? undefined : atencion.modulo} />
          <Dato label="Líder de cosecha" value={atencion.lider_cosecha} />
          <Dato label="Grupo" value={atencion.grupo} />
          <Dato label="Alcance" value={atencion.alcance} />
          <Dato label="Actividad" value={atencion.area} />
          <Dato label="Tipo de atención" value={atencion.tipo_atencion_360?.join(' / ')} />
          <Dato label="Alertas" value={atencion.alertas_360?.join(' / ')} />
          <Dato label="Detalle de la alerta" value={atencion.detalle_alerta} />
          <Dato label="Compromiso" value={atencion.compromiso_generado === true ? 'Sí' : atencion.compromiso_generado === false ? 'No' : undefined} />
          <Dato label="Detalle compromiso" value={atencion.detalle_compromiso} />
          <Dato label="Fecha fin compromiso" value={atencion.fecha_fin_compromiso} />
          <Dato label="Evidencia" value={atencion.evidencia_360} />
          <Dato label="Observaciones" value={atencion.comentarios} />
        </dl>
      ) : (
        <>
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
        </>
      )}

      {atencion.estado === 'CERRADO' && atencion.tipo_registro !== '360 LABORAL' && (
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

      {atencion.estado === 'CERRADO' && atencion.compromiso_generado === true && (
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <p className="text-xs font-medium text-neutral-500 mb-2">Cierre del compromiso</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Dato label="Fecha de cierre" value={atencion.fecha_cierre} />
            <Dato label="Cómo se cerró" value={atencion.resultado_compromiso} />
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
