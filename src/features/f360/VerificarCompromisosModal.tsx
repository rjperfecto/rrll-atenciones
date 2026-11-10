import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, PenLine } from 'lucide-react'
import { obtenerAtencion, crearAtencion, editarAtencion } from '@/lib/atencionesApi'
import { buscarGrupoCompleto, type LiderGrupo } from '@/lib/busquedaApi'
import { subirDocumentoFirmado } from '@/lib/documentosFirmadosApi'
import { obtenerFirmaPersonal, descargarBytesFirmaPersonal } from '@/lib/firmasPersonalApi'
import { supRrllPorZona } from '@/data/supervisoresRrll'
import { dniDesdeLegajo } from '@/data/legajo'
import {
  SIN_COMPROMISO,
  ESTADOS_VERIFICACION_COMPROMISO,
  ETIQUETA_ESTADO_VERIFICACION,
  RESULTADOS_VERIFICACION,
  type EstadoVerificacionCompromiso,
  type ResultadoVerificacion,
} from '@/data/formulario360'
import { useAuth } from '@/features/auth/AuthContext'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { FirmaCanvas } from '@/components/ui/FirmaCanvas'
import type { Atencion, AlertaReportada360 } from '@/types'

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

interface ItemVerificacion {
  idx: number
  tipo: 'LIDER' | 'RRLL'
  texto: string
  estado: EstadoVerificacionCompromiso | ''
  detalle: string
}

// Verifica una ronda de compromisos de 360 Laboral (líder y RRLL juntos,
// alerta por alerta) y genera + hace firmar la carta de verificación (ver
// cartaVerificacion360.ts). La ronda queda guardada como un registro nuevo
// de 360 Laboral enlazado a la caminata original (caminata_origen_id, ver
// migración 0043), no como una edición de `atencion` — así se arma la línea
// de tiempo de visitas al grupo. `atencion` puede ser la caminata original o
// una ronda de verificación anterior: siempre se verifican los mismos
// compromisos originales (los de la raíz de la cadena), frescos en cada ronda.
export function VerificarCompromisosModal({ atencion, onClose }: { atencion: Atencion; onClose: () => void }) {
  const { profile } = useAuth()
  const [raiz, setRaiz] = useState<Atencion | null>(null)
  const [cargando, setCargando] = useState(true)
  const [lider, setLider] = useState<LiderGrupo | null>(null)

  const [fecha, setFecha] = useState(hoy())
  const [items, setItems] = useState<ItemVerificacion[]>([])
  const [observaciones, setObservaciones] = useState('')
  const [resultado, setResultado] = useState<ResultadoVerificacion | ''>('')
  const [nuevaFecha, setNuevaFecha] = useState('')

  const [firmaPng, setFirmaPng] = useState<Uint8Array | null>(null)
  const [mostrarFirma, setMostrarFirma] = useState(false)

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const raizId = atencion.caminata_origen_id ?? atencion.id
    setCargando(true)
    void (raizId === atencion.id ? Promise.resolve(atencion) : obtenerAtencion(raizId)).then((r) => {
      setRaiz(r)
      if (r) {
        const nuevos: ItemVerificacion[] = []
        r.alertas_reportadas.forEach((a, idx) => {
          if (a.accion && a.accion !== SIN_COMPROMISO) nuevos.push({ idx, tipo: 'LIDER', texto: a.accion, estado: '', detalle: '' })
          if (a.accion_rrll && a.accion_rrll !== SIN_COMPROMISO) nuevos.push({ idx, tipo: 'RRLL', texto: a.accion_rrll, estado: '', detalle: '' })
        })
        setItems(nuevos)
      }
      setCargando(false)
    })
  }, [atencion])

  // Legajo del líder (para el DNI del pie de firma): se rebusca por grupo a
  // la fecha de esta verificación, igual que al registrar la caminata — no
  // se guarda el legajo en la atención, solo el nombre.
  useEffect(() => {
    if (!raiz?.grupo) return
    void buscarGrupoCompleto(raiz.grupo, fecha).then((r) => setLider(r?.lider ?? null))
  }, [raiz, fecha])

  function actualizarItem(i: number, cambios: Partial<ItemVerificacion>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...cambios } : it)))
  }

  const faltaAlgunEstado = items.some((it) => !it.estado)
  const faltaNuevaFecha = resultado === 'SEGUIMIENTO_ADICIONAL' && !nuevaFecha
  const listoParaFirmar = items.length > 0 && !faltaAlgunEstado && Boolean(resultado) && !faltaNuevaFecha && Boolean(lider?.legajo)

  async function guardar() {
    if (!profile || !raiz || !firmaPng || !lider?.legajo || !resultado) return
    setError(null)
    setGuardando(true)
    try {
      const dni = dniDesdeLegajo(lider.legajo)
      const alertasConVerificacion: AlertaReportada360[] = raiz.alertas_reportadas.map((a, idx) => {
        const itemLider = items.find((it) => it.idx === idx && it.tipo === 'LIDER')
        const itemRrll = items.find((it) => it.idx === idx && it.tipo === 'RRLL')
        return {
          ...a,
          verificacion_lider: itemLider?.estado || undefined,
          verificacion_lider_detalle: itemLider?.detalle || undefined,
          verificacion_rrll: itemRrll?.estado || undefined,
          verificacion_rrll_detalle: itemRrll?.detalle || undefined,
        }
      })

      // Firma del responsable (Administración > Firmas de personal): si no
      // tiene una guardada, la carta solo imprime su nombre, no bloquea.
      const firmaResponsablePersonal = await obtenerFirmaPersonal(profile.id)
      let firmaResponsable: { png: Uint8Array; nombre: string } | null = null
      if (firmaResponsablePersonal) {
        const { bytes } = await descargarBytesFirmaPersonal(firmaResponsablePersonal.storage_path)
        if (bytes) firmaResponsable = { png: new Uint8Array(bytes), nombre: profile.nombre_completo }
      }

      // pdf-lib se importa dinámicamente, ver mismo comentario en
      // RegistrarCaminata.tsx (CompromisosList tampoco es lazy).
      const { generarCartaVerificacion360 } = await import('@/lib/cartaVerificacion360')
      const pdfBytes = await generarCartaVerificacion360(
        {
          fechaCartaAnterior: atencion.fecha,
          fechaVisita: raiz.fecha,
          grupo: raiz.grupo ?? '',
          fundo: raiz.fundo ?? '',
          liderCosecha: raiz.lider_cosecha ?? '',
          alertas: alertasConVerificacion,
          observaciones,
          resultado,
          nuevaFechaVerificacion: resultado === 'SEGUIMIENTO_ADICIONAL' ? nuevaFecha : null,
          responsableNombre: profile.nombre_completo,
          fechaRecepcion: fecha,
        },
        firmaResponsable,
        { png: firmaPng, nombre: lider.nombre_completo, dni },
      )

      const now = new Date().toISOString()
      const nuevaRonda: Atencion = {
        id: crypto.randomUUID(),
        client_uuid: crypto.randomUUID(),
        tipo_registro: '360 LABORAL',
        fecha,
        fecha_cierre: resultado === 'CIERRE_EFECTIVO' ? fecha : null,
        zona: raiz.zona,
        fundo: raiz.fundo,
        modulo: raiz.modulo,
        grupo: raiz.grupo,
        area: raiz.area,
        tipo: null,
        categoria: null,
        subcategoria: null,
        falta: null,
        gravedad: raiz.gravedad,
        comentarios: observaciones || null,
        involucrados: [],
        estado: resultado === 'CIERRE_EFECTIVO' ? 'CERRADO' : 'ABIERTO',
        accion_correctiva: null,
        dias_suspension: null,
        detalle_cierre: null,
        sup_cuadrilla: null,
        responsable_id: profile.id,
        responsable_nombre: profile.nombre_completo.trim().replace(/\s+/g, ' ').toUpperCase(),
        sup_rrll: supRrllPorZona(raiz.zona),
        reporte: null,
        antecedente: null,
        notas_seguimiento: null,
        lider_cosecha: raiz.lider_cosecha,
        total_encuestado: null,
        // "SEGUIMIENTO" (no "COMPROMISO"/"CONVERSATORIO"): esta visita es,
        // justamente, el seguimiento de los compromisos de la caminata raíz.
        tipo_atencion_360: ['SEGUIMIENTO'],
        alertas_reportadas: alertasConVerificacion,
        alertas_360: null,
        detalle_alerta: null,
        compromiso_generado: resultado !== 'CIERRE_EFECTIVO',
        detalle_compromiso: null,
        fecha_fin_compromiso: resultado === 'SEGUIMIENTO_ADICIONAL' ? nuevaFecha : null,
        evidencia_360: null,
        resultado_compromiso: resultado === 'CIERRE_EFECTIVO' ? 'CIERRE EFECTIVO' : 'SEGUIMIENTO ADICIONAL',
        documento_firmado_path: null,
        caminata_origen_id: raiz.id,
        created_at: now,
        updated_at: now,
      }

      const { error: errCrear } = await crearAtencion(nuevaRonda)
      if (errCrear) throw new Error(errCrear)

      const { path } = await subirDocumentoFirmado(nuevaRonda.id, pdfBytes)
      if (path) await editarAtencion(nuevaRonda.id, { documento_firmado_path: path })

      // La ronda/caminata que se acaba de verificar queda cerrada: su
      // seguimiento ya se hizo, lo pendiente (si queda algo) vive ahora en
      // la ronda nueva recién creada, no acá.
      await editarAtencion(atencion.id, { estado: 'CERRADO', fecha_cierre: fecha, updated_at: now })

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la verificación.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal title="Verificar compromisos" description={`${atencion.lider_cosecha ?? ''} · ${atencion.grupo ?? ''}`} onClose={onClose} size="lg">
      {cargando ? (
        <p className="text-sm text-neutral-500">Cargando compromisos...</p>
      ) : !raiz ? (
        <p className="text-sm text-danger">No se pudo cargar la caminata original de este compromiso.</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-neutral-500">Esta caminata no tiene compromisos reales que verificar.</p>
      ) : (
        <div className="space-y-4">
          <Field label="Fecha de esta verificación">
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="input" />
          </Field>

          <div className="space-y-3">
            {items.map((it, i) => (
              <div key={`${it.idx}-${it.tipo}`} className="rounded-lg border border-neutral-200 p-3 space-y-2">
                <p className="text-xs font-medium text-neutral-500">{it.tipo === 'LIDER' ? 'Compromiso del líder' : 'Compromiso de RRLL'}</p>
                <p className="text-sm text-neutral-800">{it.texto}</p>
                <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-2 items-start">
                  <select
                    value={it.estado}
                    onChange={(e) => actualizarItem(i, { estado: e.target.value as EstadoVerificacionCompromiso | '' })}
                    className="input"
                  >
                    <option value="">Estado...</option>
                    {ESTADOS_VERIFICACION_COMPROMISO.map((e) => (
                      <option key={e} value={e}>
                        {ETIQUETA_ESTADO_VERIFICACION[e]}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Detalle (opcional)"
                    value={it.detalle}
                    onChange={(e) => actualizarItem(i, { detalle: e.target.value.toUpperCase() })}
                    className="input"
                  />
                </div>
              </div>
            ))}
          </div>

          <Field label="Observaciones">
            <textarea rows={3} value={observaciones} onChange={(e) => setObservaciones(e.target.value.toUpperCase())} className="input" />
          </Field>

          <div>
            <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">Resultado general</label>
            <div className="space-y-2">
              {RESULTADOS_VERIFICACION.map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
                  <input type="radio" name="resultado" checked={resultado === r} onChange={() => setResultado(r)} />
                  {r === 'CIERRE_EFECTIVO'
                    ? 'Cierre efectivo: los compromisos fueron cumplidos, se cierra el seguimiento.'
                    : 'Seguimiento adicional: se mantiene en seguimiento.'}
                </label>
              ))}
            </div>
          </div>

          {resultado === 'SEGUIMIENTO_ADICIONAL' && (
            <Field label="Nueva fecha de verificación">
              <input type="date" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} className="input" />
            </Field>
          )}

          {!lider?.legajo && raiz.grupo && (
            <p className="text-xs text-amber-600 flex items-center gap-1.5">
              <AlertCircle className="size-3.5 shrink-0" />
              No se encontró al líder en el tareo de esa fecha, no se puede firmar. Prueba con otra fecha de verificación.
            </p>
          )}

          <div className="pt-2 border-t border-neutral-200">
            <Button type="button" variant={firmaPng ? 'secondary' : 'primary'} onClick={() => setMostrarFirma(true)} disabled={!listoParaFirmar}>
              <PenLine className="size-4" />
              {firmaPng ? 'Firma lista — volver a firmar' : 'Firmar documento (trabajador)'}
            </Button>
          </div>

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
            <Button type="button" onClick={guardar} loading={guardando} disabled={!firmaPng || !listoParaFirmar}>
              {guardando ? (
                'Guardando...'
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Guardar verificación
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {mostrarFirma && lider && (
        <FirmaCanvas
          titulo="Firma del trabajador"
          descripcion={`${lider.nombre_completo} toma conocimiento del resultado de la verificación.`}
          onGuardar={(png) => {
            setFirmaPng(png)
            setMostrarFirma(false)
          }}
          onCancelar={() => setMostrarFirma(false)}
        />
      )}
    </Modal>
  )
}
