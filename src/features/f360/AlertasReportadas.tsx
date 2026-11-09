import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { categoriasAlerta360, subcategoriasAlerta360, nivelAlerta360 } from '@/data/formulario360'
import { fechaCorta } from '@/lib/fechaLarga'
import { GravedadBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import type { AlertaReportada360 } from '@/types'

// Editor de alertas de 360 Laboral: Categoría -> Subcategoría (el nivel se
// deriva del catálogo, no lo elige el usuario) + cantidad de personal que
// reportó esa alerta, su detalle y los dos compromisos asumidos — el del
// trabajador/líder (Compromiso) y el del equipo de RRLL (Compromiso RRLL) —
// que reemplazan a la antigua sección "Compromiso" única del formulario
// (ver RegistrarCaminata). Compartido entre RegistrarCaminata
// (react-hook-form) y EditarAtencionModal (useState) via valores/onChange
// controlados.

// Toda alerta requiere ambos compromisos: si alguno no se generó, en vez de
// dejarlo vacío o con texto libre variado ("NINGUNO", "N/A", ...) se marca
// el checkbox correspondiente y queda esta frase fija, para no acumular
// variantes (mismo criterio que ACCIONES_CORRECTIVAS en
// src/data/accionCorrectiva.ts).
const SIN_COMPROMISO = 'NO SE GENERÓ COMPROMISO'

export function AlertasReportadas({
  valores,
  onChange,
}: {
  valores: AlertaReportada360[]
  onChange: (siguiente: AlertaReportada360[]) => void
}) {
  const [categoria, setCategoria] = useState('')
  const [subcategoria, setSubcategoria] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [detalle, setDetalle] = useState('')
  const [accion, setAccion] = useState('')
  const [accionRrll, setAccionRrll] = useState('')
  const [fechaVerificacion, setFechaVerificacion] = useState('')
  const [fechaVerificacionRrll, setFechaVerificacionRrll] = useState('')
  const sinCompromiso = accion === SIN_COMPROMISO
  const sinCompromisoRrll = accionRrll === SIN_COMPROMISO

  const categorias = categoriasAlerta360()
  const yaAgregadas = new Set(valores.map((v) => `${v.categoria}::${v.subcategoria}`))
  const subcategorias = categoria ? subcategoriasAlerta360(categoria).filter((s) => !yaAgregadas.has(`${categoria}::${s}`)) : []
  const faltaAlgo =
    !categoria ||
    !subcategoria ||
    !cantidad ||
    !detalle.trim() ||
    !accion.trim() ||
    (!sinCompromiso && !fechaVerificacion) ||
    !accionRrll.trim() ||
    (!sinCompromisoRrll && !fechaVerificacionRrll)

  function alternarSinCompromiso(marcado: boolean) {
    setAccion(marcado ? SIN_COMPROMISO : '')
    setFechaVerificacion('')
  }

  function alternarSinCompromisoRrll(marcado: boolean) {
    setAccionRrll(marcado ? SIN_COMPROMISO : '')
    setFechaVerificacionRrll('')
  }

  function agregar() {
    const cantidadNum = Number(cantidad)
    const nivel = nivelAlerta360(categoria, subcategoria)
    if (
      !categoria ||
      !subcategoria ||
      !nivel ||
      !Number.isFinite(cantidadNum) ||
      cantidadNum < 1 ||
      !detalle.trim() ||
      !accion.trim() ||
      (!sinCompromiso && !fechaVerificacion) ||
      !accionRrll.trim() ||
      (!sinCompromisoRrll && !fechaVerificacionRrll)
    )
      return
    onChange([
      ...valores,
      {
        categoria,
        subcategoria,
        nivel,
        cantidad: cantidadNum,
        detalle: detalle.trim(),
        accion: accion.trim(),
        accion_rrll: accionRrll.trim(),
        fecha_verificacion: sinCompromiso ? '' : fechaVerificacion,
        fecha_verificacion_rrll: sinCompromisoRrll ? '' : fechaVerificacionRrll,
      },
    ])
    setCategoria('')
    setSubcategoria('')
    setCantidad('')
    setDetalle('')
    setAccion('')
    setAccionRrll('')
    setFechaVerificacion('')
    setFechaVerificacionRrll('')
  }

  function quitar(index: number) {
    onChange(valores.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_6rem] gap-2">
        <div>
          <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">Categoría</label>
          <select
            value={categoria}
            onChange={(e) => {
              setCategoria(e.target.value)
              setSubcategoria('')
            }}
            className="input"
          >
            <option value="">Selecciona...</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">Subcategoría</label>
          <select
            value={subcategoria}
            onChange={(e) => setSubcategoria(e.target.value)}
            disabled={!categoria}
            className={cn('input', !categoria && 'bg-neutral-100 text-neutral-500 cursor-not-allowed')}
          >
            <option value="">Selecciona...</option>
            {subcategorias.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">Cantidad</label>
          <input type="number" min={1} value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="input" />
        </div>
      </div>
      <div>
        <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">Detalle de esta alerta</label>
        <input type="text" value={detalle} onChange={(e) => setDetalle(e.target.value.toUpperCase())} className="input" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">Compromiso</label>
          <input
            type="text"
            value={accion}
            onChange={(e) => setAccion(e.target.value.toUpperCase())}
            disabled={sinCompromiso}
            className={cn('input', sinCompromiso && 'bg-neutral-100 text-neutral-500 cursor-not-allowed')}
          />
          <label className="flex items-center gap-1.5 mt-1.5 text-xs text-neutral-500">
            <input type="checkbox" checked={sinCompromiso} onChange={(e) => alternarSinCompromiso(e.target.checked)} />
            No se generó compromiso
          </label>
          {!sinCompromiso && (
            <div className="mt-1.5">
              <label className="block text-[12px] text-neutral-500 mb-1">Fecha de verificación</label>
              <input
                type="date"
                value={fechaVerificacion}
                onChange={(e) => setFechaVerificacion(e.target.value)}
                className="input"
              />
            </div>
          )}
        </div>
        <div>
          <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">Compromiso RRLL</label>
          <input
            type="text"
            value={accionRrll}
            onChange={(e) => setAccionRrll(e.target.value.toUpperCase())}
            disabled={sinCompromisoRrll}
            className={cn('input', sinCompromisoRrll && 'bg-neutral-100 text-neutral-500 cursor-not-allowed')}
          />
          <label className="flex items-center gap-1.5 mt-1.5 text-xs text-neutral-500">
            <input type="checkbox" checked={sinCompromisoRrll} onChange={(e) => alternarSinCompromisoRrll(e.target.checked)} />
            No se generó compromiso
          </label>
          {!sinCompromisoRrll && (
            <div className="mt-1.5">
              <label className="block text-[12px] text-neutral-500 mb-1">Fecha de verificación</label>
              <input
                type="date"
                value={fechaVerificacionRrll}
                onChange={(e) => setFechaVerificacionRrll(e.target.value)}
                className="input"
              />
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="button" variant="secondary" onClick={agregar} disabled={faltaAlgo} className="shrink-0">
          <Plus className="size-4" />
          Agregar
        </Button>
      </div>

      {valores.length > 0 && (
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200">
          {valores.map((v, i) => (
            <li key={`${v.categoria}::${v.subcategoria}`} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm text-neutral-800 truncate">
                  {v.categoria} · {v.subcategoria}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <GravedadBadge gravedad={v.nivel} />
                  <span className="text-xs text-neutral-500">
                    {v.cantidad} persona{v.cantidad === 1 ? '' : 's'}
                  </span>
                </div>
                {v.detalle && <p className="text-xs text-neutral-500 mt-1">{v.detalle}</p>}
                {v.accion && (
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Compromiso: {v.accion}
                    {v.fecha_verificacion && ` — Verificación: ${fechaCorta(v.fecha_verificacion)}`}
                  </p>
                )}
                {v.accion_rrll && (
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Compromiso RRLL: {v.accion_rrll}
                    {v.fecha_verificacion_rrll && ` — Verificación: ${fechaCorta(v.fecha_verificacion_rrll)}`}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => quitar(i)}
                className="p-1.5 rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-danger shrink-0"
                aria-label="Quitar alerta"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
