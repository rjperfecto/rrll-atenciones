import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { AlertTriangle, Bell, ClipboardCheck, FileWarning, Handshake, MapPin, Paperclip, StickyNote } from 'lucide-react'
import { conMayusculas } from '@/lib/conMayusculas'
import { ZONAS } from '@/data/zonasFundos'
import {
  SEDES_360,
  PACKING_SEDES,
  TURNOS_360,
  FUNDOS_POR_ZONA_360,
  TIPOS_ATENCION_360,
  ALERTAS_360,
} from '@/data/formulario360'
import { GRAVEDAD_COLORES } from '@/components/ui/Badge'
import { CardSection } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { cn } from '@/lib/cn'
import type { Atencion360FormValues } from './atencion360Schema'

const NIVELES_CONFLICTIVIDAD = ['BAJO', 'MEDIO', 'ALTO'] as const

// Segmented control de una sola opción (mismo patrón visual que el
// selector de "Tipo de registro" en AtencionForm): usado para Sede,
// Turno, Packing, Compromiso.
function SegmentedControl<T extends string>({
  opciones,
  valor,
  onChange,
  colorPorOpcion,
}: {
  opciones: readonly T[]
  valor: T | undefined
  onChange: (v: T) => void
  colorPorOpcion?: Record<string, string>
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${opciones.length}, minmax(0, 1fr))` }}>
      {opciones.map((op) => {
        const activo = valor === op
        const color = colorPorOpcion?.[op]
        return (
          <button
            key={op}
            type="button"
            onClick={() => onChange(op)}
            className={cn(
              'rounded-lg border py-2.5 text-sm font-semibold text-center transition-all duration-200',
              activo ? 'text-white border-transparent shadow-sm' : 'bg-white text-navy border-neutral-200 hover:border-brand/40',
            )}
            style={activo ? { backgroundColor: color ?? 'var(--color-brand)' } : undefined}
          >
            {op}
          </button>
        )
      })}
    </div>
  )
}

function CheckboxGroup({
  opciones,
  valores,
  onToggle,
}: {
  opciones: readonly string[]
  valores: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div className="space-y-2">
      {opciones.map((op) => (
        <label key={op} className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
          <input
            type="checkbox"
            checked={valores.includes(op)}
            onChange={() => onToggle(op)}
            className="size-4 rounded border-neutral-300 text-brand focus:ring-brand/30"
          />
          {op}
        </label>
      ))}
      <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
        <input
          type="checkbox"
          checked={valores.includes('OTRAS')}
          onChange={() => onToggle('OTRAS')}
          className="size-4 rounded border-neutral-300 text-brand focus:ring-brand/30"
        />
        Otras
      </label>
    </div>
  )
}

// Cuerpo del formulario "360 Laboral": registro de sesión/grupo
// (conversatorio/seguimiento/compromiso), replica la ramificación del
// formulario de Microsoft Forms usado hoy en campo (ver plan/migración
// 0014_form_360_laboral.sql). No pide Legajo/DNI/Nombre de trabajador ni
// usa la Matriz Tipo/Categoría/Subcategoría — es un formulario aparte de
// FormularioGeneral.tsx, no una variación con más campos opcionales.
export function Formulario360Laboral() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useFormContext<any>() as ReturnType<typeof useFormContext<Atencion360FormValues>>

  const valores = watch()
  const err = errors as Record<string, { message?: string } | undefined>

  const fundosDeZona = useMemo(() => (valores.zona ? FUNDOS_POR_ZONA_360[valores.zona] : undefined), [valores.zona])
  const zonaConFundo = Boolean(fundosDeZona)

  const tipoAtencion360 = valores.tipoAtencion360 ?? []
  const alertas360 = valores.alertas360 ?? []

  function toggle(campo: 'tipoAtencion360' | 'alertas360', valor: string) {
    const actual: string[] = valores[campo] ?? []
    const siguiente = actual.includes(valor) ? actual.filter((v) => v !== valor) : [...actual, valor]
    setValue(campo, siguiente as never, { shouldValidate: true, shouldDirty: true })
  }

  return (
    <>
      <CardSection title="Nivel de conflictividad" icon={<AlertTriangle className="size-4 text-brand" />}>
        <SegmentedControl
          opciones={NIVELES_CONFLICTIVIDAD}
          valor={valores.nivelConflictividad}
          onChange={(v) => setValue('nivelConflictividad', v as never, { shouldValidate: true, shouldDirty: true })}
          colorPorOpcion={GRAVEDAD_COLORES}
        />
        {err.nivelConflictividad && <p className="text-xs text-danger mt-1">{err.nivelConflictividad.message}</p>}
      </CardSection>

      <CardSection title="Sede" icon={<MapPin className="size-4 text-brand" />}>
        <SegmentedControl
          opciones={SEDES_360}
          valor={valores.sede}
          onChange={(v) => setValue('sede', v as never, { shouldValidate: true, shouldDirty: true })}
        />
        {err.sede && <p className="text-xs text-danger mt-1">{err.sede.message}</p>}

        {valores.sede === 'PACKING' && (
          <div className="space-y-4 pt-2">
            <div>
              <p className="text-[13px] font-medium text-neutral-700 mb-1.5">Packing</p>
              <SegmentedControl
                opciones={PACKING_SEDES}
                valor={valores.packingSede}
                onChange={(v) => setValue('packingSede', v as never, { shouldValidate: true, shouldDirty: true })}
              />
              {err.packingSede && <p className="text-xs text-danger mt-1">{err.packingSede.message}</p>}
            </div>
            <div>
              <p className="text-[13px] font-medium text-neutral-700 mb-1.5">Turno</p>
              <SegmentedControl
                opciones={TURNOS_360}
                valor={valores.turno}
                onChange={(v) => setValue('turno', v as never, { shouldValidate: true, shouldDirty: true })}
              />
              {err.turno && <p className="text-xs text-danger mt-1">{err.turno.message}</p>}
            </div>
          </div>
        )}

        {valores.sede === 'FUNDO' && (
          <div className="space-y-4 pt-2">
            <Field label="Líder de cosecha" value={valores.liderCosecha} error={err.liderCosecha?.message}>
              <input type="text" {...conMayusculas(register('liderCosecha' as never))} className="input" />
            </Field>
            <Field label="Grupo" value={valores.grupo} error={err.grupo?.message}>
              <input type="text" {...conMayusculas(register('grupo' as never))} className="input" />
            </Field>
            <Field label="Alcance" value={valores.alcance} error={err.alcance?.message} hint="Cantidad de personas alcanzadas">
              <input type="number" min={0} {...register('alcance' as never, { valueAsNumber: true })} className="input" />
            </Field>
            <Field label="Zona" value={valores.zona} error={err.zona?.message}>
              <select
                {...register('zona' as never)}
                className="input"
                onChange={(e) => {
                  setValue('zona' as never, e.target.value as never, { shouldValidate: true })
                  setValue('fundo' as never, '' as never)
                }}
              >
                <option value="">Selecciona...</option>
                {ZONAS.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </Field>
            {zonaConFundo && (
              <Field label="Fundo" value={valores.fundo} error={err.fundo?.message}>
                <select {...register('fundo' as never)} className="input">
                  <option value="">Selecciona...</option>
                  {fundosDeZona!.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Módulo" value={valores.modulo} error={err.modulo?.message}>
              <input type="text" {...conMayusculas(register('modulo' as never))} className="input" />
            </Field>
          </div>
        )}
      </CardSection>

      {valores.sede && (
        <>
          <CardSection title="Actividad" icon={<ClipboardCheck className="size-4 text-brand" />}>
            <Field label="Actividad realizada" value={valores.actividad} error={err.actividad?.message}>
              <input type="text" {...conMayusculas(register('actividad' as never))} className="input" />
            </Field>
          </CardSection>

          <CardSection title="Tipo de atención" icon={<FileWarning className="size-4 text-brand" />}>
            <CheckboxGroup opciones={TIPOS_ATENCION_360} valores={tipoAtencion360} onToggle={(v) => toggle('tipoAtencion360', v)} />
            {err.tipoAtencion360 && <p className="text-xs text-danger mt-1">{err.tipoAtencion360.message}</p>}
            {tipoAtencion360.includes('OTRAS') && (
              <Field label="Especifica" value={valores.otroTipoAtencion} error={err.otroTipoAtencion?.message} className="mt-3">
                <input type="text" {...conMayusculas(register('otroTipoAtencion' as never))} className="input" />
              </Field>
            )}
          </CardSection>

          <CardSection title="Alertas" icon={<Bell className="size-4 text-brand" />}>
            <CheckboxGroup opciones={ALERTAS_360} valores={alertas360} onToggle={(v) => toggle('alertas360', v)} />
            {err.alertas360 && <p className="text-xs text-danger mt-1">{err.alertas360.message}</p>}
            {alertas360.includes('OTRAS') && (
              <Field label="Especifica" value={valores.otraAlerta} error={err.otraAlerta?.message} className="mt-3">
                <input type="text" {...conMayusculas(register('otraAlerta' as never))} className="input" />
              </Field>
            )}
            <Field label="Detalle de la alerta" value={valores.detalleAlerta} error={err.detalleAlerta?.message} className="mt-3">
              <textarea rows={3} {...conMayusculas(register('detalleAlerta' as never))} className="input" />
            </Field>
          </CardSection>

          <CardSection title="Compromiso" icon={<Handshake className="size-4 text-brand" />}>
            <SegmentedControl
              opciones={['SI', 'NO'] as const}
              valor={valores.compromisoGenerado}
              onChange={(v) => setValue('compromisoGenerado', v as never, { shouldValidate: true, shouldDirty: true })}
            />
            {err.compromisoGenerado && <p className="text-xs text-danger mt-1">{err.compromisoGenerado.message}</p>}
            {valores.compromisoGenerado === 'SI' && (
              <div className="space-y-4 pt-3">
                <Field label="Detalle del compromiso" value={valores.detalleCompromiso} error={err.detalleCompromiso?.message}>
                  <textarea rows={3} {...conMayusculas(register('detalleCompromiso' as never))} className="input" />
                </Field>
                <Field label="Fecha fin de compromiso" value={valores.fechaFinCompromiso} error={err.fechaFinCompromiso?.message}>
                  <input type="date" {...register('fechaFinCompromiso' as never)} className="input" />
                </Field>
              </div>
            )}
          </CardSection>

          <CardSection title="Evidencia" icon={<Paperclip className="size-4 text-brand" />}>
            <Field label="Evidencia de 360 laboral" value={valores.evidencia360} error={err.evidencia360?.message} hint="Referencia o enlace (por ahora no se sube el archivo directamente)">
              <input type="text" {...conMayusculas(register('evidencia360' as never))} className="input" />
            </Field>
          </CardSection>

          <CardSection title="Observaciones" icon={<StickyNote className="size-4 text-brand" />}>
            <Field label="Observaciones" value={valores.observaciones} error={err.observaciones?.message}>
              <textarea rows={3} {...conMayusculas(register('observaciones' as never))} className="input" />
            </Field>
          </CardSection>
        </>
      )}
    </>
  )
}
