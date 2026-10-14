import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { categoriasAlerta360, subcategoriasAlerta360, nivelAlerta360 } from '@/data/formulario360'
import { GravedadBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import type { AlertaReportada360 } from '@/types'

// Editor de alertas de 360 Laboral: Categoría -> Subcategoría (el nivel se
// deriva del catálogo, no lo elige el usuario) + cantidad de personal que
// reportó esa alerta, su detalle y la acción tomada (reemplaza la antigua
// sección "Compromiso" única del formulario, ver RegistrarCaminata).
// Compartido entre RegistrarCaminata (react-hook-form) y EditarAtencionModal
// (useState) via valores/onChange controlados.
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

  const categorias = categoriasAlerta360()
  const yaAgregadas = new Set(valores.map((v) => `${v.categoria}::${v.subcategoria}`))
  const subcategorias = categoria ? subcategoriasAlerta360(categoria).filter((s) => !yaAgregadas.has(`${categoria}::${s}`)) : []
  const faltaAlgo = !categoria || !subcategoria || !cantidad || !detalle.trim() || !accion.trim()

  function agregar() {
    const cantidadNum = Number(cantidad)
    const nivel = nivelAlerta360(categoria, subcategoria)
    if (!categoria || !subcategoria || !nivel || !Number.isFinite(cantidadNum) || cantidadNum < 1 || !detalle.trim() || !accion.trim()) return
    onChange([...valores, { categoria, subcategoria, nivel, cantidad: cantidadNum, detalle: detalle.trim(), accion: accion.trim() }])
    setCategoria('')
    setSubcategoria('')
    setCantidad('')
    setDetalle('')
    setAccion('')
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">Detalle de esta alerta</label>
          <input type="text" value={detalle} onChange={(e) => setDetalle(e.target.value.toUpperCase())} className="input" />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">Acción</label>
          <input type="text" value={accion} onChange={(e) => setAccion(e.target.value.toUpperCase())} className="input" />
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
                {v.accion && <p className="text-xs text-neutral-500 mt-0.5">Acción: {v.accion}</p>}
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
