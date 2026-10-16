import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { crearCapacitacion, editarCapacitacion, eliminarCapacitacion } from '@/lib/capacitacionesApi'
import { listarNombresPersonal } from '@/lib/personalZonaApi'
import { COLORES_AGENDA } from '@/data/coloresAgenda'
import { UBICACIONES_AGENDA } from '@/data/agendaCatalogos'
import { SLOTS_AGENDA, HORAS_FIN_AGENDA } from './agendaHoras'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import type { Capacitacion } from '@/types'

type Valores = {
  fecha: string
  horaInicio: string
  horaFin: string
  responsable: string
  tema: string
  ubicacion: string
  color: string
}

export function CapacitacionModal({
  valoresIniciales,
  existente,
  soloLectura,
  creadorId,
  creadorNombre,
  onClose,
  onGuardado,
}: {
  valoresIniciales: Valores
  existente: Capacitacion | null
  soloLectura: boolean
  // Solo se usan al crear (existente === null): quién queda como dueño del
  // registro, para que luego solo esa persona (o ADMIN) pueda editarlo/
  // borrarlo (ver RLS en migración 0027).
  creadorId: string
  creadorNombre: string
  onClose: () => void
  onGuardado: () => void
}) {
  const [valores, setValores] = useState<Valores>(valoresIniciales)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nombres, setNombres] = useState<{ id: string; nombre_completo: string }[]>([])
  const [errorNombres, setErrorNombres] = useState<string | null>(null)

  useEffect(() => {
    void listarNombresPersonal().then(({ data, error: err }) => {
      setNombres(data)
      setErrorNombres(err)
    })
  }, [])

  function set<K extends keyof Valores>(campo: K, valor: Valores[K]) {
    setValores((v) => ({ ...v, [campo]: valor }))
  }

  const horasFinValidas = HORAS_FIN_AGENDA.filter((h) => h > valores.horaInicio)
  // Si el responsable guardado ya no está en la lista (ej. usuario
  // desactivado) igual se muestra, para no perderlo silenciosamente al editar.
  const nombresResponsable = nombres.map((n) => n.nombre_completo.toUpperCase())
  const opcionesResponsable =
    valores.responsable && !nombresResponsable.includes(valores.responsable)
      ? [valores.responsable, ...nombresResponsable]
      : nombresResponsable

  async function guardar() {
    if (!valores.responsable.trim() || !valores.tema.trim() || !valores.ubicacion.trim()) {
      setError('Completa responsable, tema y ubicación.')
      return
    }
    setError(null)
    setGuardando(true)
    const datos = {
      fecha: valores.fecha,
      hora_inicio: valores.horaInicio,
      hora_fin: valores.horaFin,
      responsable: valores.responsable.trim().toUpperCase(),
      tema: valores.tema.trim().toUpperCase(),
      ubicacion: valores.ubicacion.trim().toUpperCase(),
      color: valores.color,
    }
    const { error: err } = existente
      ? await editarCapacitacion(existente.id, datos)
      : await crearCapacitacion({
          id: crypto.randomUUID(),
          creado_por: creadorId,
          creado_por_nombre: creadorNombre,
          ...datos,
        })
    setGuardando(false)
    if (err) {
      setError(`No se pudo guardar: ${err}`)
      return
    }
    onGuardado()
  }

  async function eliminar() {
    if (!existente) return
    const confirmado = window.confirm(`¿Eliminar "${existente.tema}"? Esta acción no se puede deshacer.`)
    if (!confirmado) return
    setEliminando(true)
    const { error: err } = await eliminarCapacitacion(existente.id)
    setEliminando(false)
    if (err) {
      setError(`No se pudo eliminar: ${err}`)
      return
    }
    onGuardado()
  }

  return (
    <Modal title={existente ? 'Reunión / capacitación' : 'Nueva reunión / capacitación'} onClose={onClose} size="sm">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Fecha">
            <input
              type="date"
              value={valores.fecha}
              disabled={soloLectura}
              onChange={(e) => set('fecha', e.target.value)}
              className={cn('input', soloLectura && 'bg-neutral-100 text-neutral-500')}
            />
          </Field>
          <Field label="Hora inicio">
            <select
              value={valores.horaInicio}
              disabled={soloLectura}
              onChange={(e) => {
                const nueva = e.target.value
                set('horaInicio', nueva)
                if (valores.horaFin <= nueva) {
                  const siguiente = HORAS_FIN_AGENDA.find((h) => h > nueva)
                  if (siguiente) set('horaFin', siguiente)
                }
              }}
              className={cn('input', soloLectura && 'bg-neutral-100 text-neutral-500')}
            >
              {SLOTS_AGENDA.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Hora fin">
            <select
              value={valores.horaFin}
              disabled={soloLectura}
              onChange={(e) => set('horaFin', e.target.value)}
              className={cn('input', soloLectura && 'bg-neutral-100 text-neutral-500')}
            >
              {horasFinValidas.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Responsable">
          <select
            value={valores.responsable}
            disabled={soloLectura}
            onChange={(e) => set('responsable', e.target.value)}
            className={cn('input', soloLectura && 'bg-neutral-100 text-neutral-500')}
          >
            <option value="">Selecciona...</option>
            {opcionesResponsable.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>
        {errorNombres && (
          <p className="text-xs text-danger -mt-3 flex items-center gap-1">
            <AlertCircle className="size-3.5 shrink-0" />
            No se pudo cargar la lista de personal: {errorNombres}
          </p>
        )}

        <Field label="Tema">
          <input
            type="text"
            value={valores.tema}
            disabled={soloLectura}
            onChange={(e) => set('tema', e.target.value.toUpperCase())}
            className={cn('input', soloLectura && 'bg-neutral-100 text-neutral-500')}
          />
        </Field>

        <Field label="Ubicación">
          <select
            value={valores.ubicacion}
            disabled={soloLectura}
            onChange={(e) => set('ubicacion', e.target.value)}
            className={cn('input', soloLectura && 'bg-neutral-100 text-neutral-500')}
          >
            <option value="">Selecciona...</option>
            {UBICACIONES_AGENDA.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </Field>

        <div>
          <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">Color</label>
          <div className="flex flex-wrap gap-2">
            {COLORES_AGENDA.map((c) => (
              <button
                key={c.id}
                type="button"
                disabled={soloLectura}
                onClick={() => set('color', c.id)}
                title={c.nombre}
                aria-label={c.nombre}
                className={cn(
                  'size-8 rounded-full border-2 transition-transform',
                  valores.color === c.id ? 'border-neutral-800 scale-110' : 'border-transparent',
                )}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>

        {existente && (
          <p className="text-xs text-neutral-400">Creado por {existente.creado_por_nombre.toUpperCase()}</p>
        )}

        {error && (
          <p className="text-sm text-danger flex items-center gap-1.5">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          {soloLectura ? (
            <Button type="button" variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          ) : (
            <>
              {existente && (
                <Button type="button" variant="danger" onClick={eliminar} loading={eliminando} className="mr-auto">
                  Eliminar
                </Button>
              )}
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="button" onClick={guardar} loading={guardando}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
