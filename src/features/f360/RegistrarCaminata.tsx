import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileWarning,
  Loader2,
  MapPin,
  Search,
  StickyNote,
  UserSearch,
} from 'lucide-react'
import { atencion360Schema, type Atencion360FormValues } from '@/features/atenciones/atencion360Schema'
import { estadoDeCampo, CLASE_INPUT_POR_ESTADO } from '@/lib/campoEstado'
import { conMayusculas } from '@/lib/conMayusculas'
import { ZONAS } from '@/data/zonasFundos'
import type { Zona } from '@/data/zonasFundos'
import { PACKING_FUNDOS, TURNOS_360, TIPOS_ATENCION_360 } from '@/data/formulario360'
import { supRrllPorZona } from '@/data/supervisoresRrll'
import { moduloDesdeFundo } from '@/lib/modulo'
import { zonaDesdeFundo } from '@/lib/zonaFundo'
import { buscarTrabajadorPorGrupo } from '@/lib/trabajadoresApi'
import { crearAtencion } from '@/lib/atencionesApi'
import { useAuth } from '@/features/auth/AuthContext'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { CardSection } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import { GRAVEDAD_COLORES } from '@/components/ui/Badge'
import { AlertasReportadas } from '@/features/f360/AlertasReportadas'
import type { Atencion, AlertaReportada360 } from '@/types'

type EstadoBusqueda = 'idle' | 'buscando' | 'encontrado' | 'no_encontrado' | 'formato_invalido'

const NIVELES_CONFLICTIVIDAD = ['BAJO', 'MEDIO', 'ALTO'] as const

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

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

function CheckboxGroup({ opciones, valores, onToggle }: { opciones: readonly string[]; valores: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="space-y-2">
      {opciones.map((op) => (
        <label key={op} className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
          <input type="checkbox" checked={valores.includes(op)} onChange={() => onToggle(op)} className="size-4 rounded border-neutral-300 text-brand focus:ring-brand/30" />
          {op}
        </label>
      ))}
      <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
        <input type="checkbox" checked={valores.includes('OTRAS')} onChange={() => onToggle('OTRAS')} className="size-4 rounded border-neutral-300 text-brand focus:ring-brand/30" />
        Otras
      </label>
    </div>
  )
}

// "Registrar caminata" (360 Laboral): registro de sesión/grupo, no de un
// trabajador individual. Ubicación (Zona/Fundo/Módulo) se captura igual que
// en Atenciones; lo único que cambia es que se busca por NÚMERO DE GRUPO
// (autocompleta Líder de cosecha y Fundo/Zona desde cualquier trabajador de
// ese grupo, ver buscarTrabajadorPorGrupo), no por legajo de un trabajador
// puntual. El total de personal encuestado se carga a mano (no todo el
// grupo se encuesta siempre). Ver plan: separa 360 Laboral de Atenciones.
export function RegistrarCaminata() {
  const { profile } = useAuth()
  const [estadoGuardado, setEstadoGuardado] = useState<'idle' | 'guardando' | 'guardado'>('idle')
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState<EstadoBusqueda>('idle')
  const [formKey, setFormKey] = useState(0)
  const zonaUsuario = profile?.zona_asignada ?? null
  const [searchParams, setSearchParams] = useSearchParams()

  // Si el usuario logueado tiene Zona fija (Administración > Personal por
  // zona), el formulario arranca con esa zona (el campo queda deshabilitado
  // más abajo).
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    trigger,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Atencion360FormValues>({
    resolver: zodResolver(atencion360Schema),
    mode: 'onTouched',
    defaultValues: {
      tipoRegistro: '360 LABORAL',
      fecha: hoy(),
      tipoAtencion360: [],
      alertasReportadas: [],
      zona: (zonaUsuario as Zona | undefined) ?? undefined,
    },
  })

  const valores = watch()
  const { grupo, fecha, zona, fundo } = valores
  const esPacking = zona === 'PACKING'
  const moduloDetectado = useMemo(() => (!esPacking && fundo ? moduloDesdeFundo(fundo) : null), [esPacking, fundo])
  const supRrll = useMemo(() => (zona ? supRrllPorZona(zona) : null), [zona])
  const estadoGrupo = estadoDeCampo(grupo, errors.grupo?.message)
  const tipoAtencion360 = valores.tipoAtencion360 ?? []
  const alertasReportadas = (valores.alertasReportadas ?? []) as AlertaReportada360[]

  function toggle(campo: 'tipoAtencion360', valor: string) {
    const actual: string[] = valores[campo] ?? []
    const siguiente = actual.includes(valor) ? actual.filter((v) => v !== valor) : [...actual, valor]
    setValue(campo, siguiente, { shouldValidate: true, shouldDirty: true })
  }

  const buscarPorGrupo = useCallback(
    // fechaOverride: para cuando se llega desde "Próximas caminatas"
    // (?grupo=&fecha=) y hay que buscar con esa fecha, no con la que ya
    // esté en el formulario en ese momento (ver efecto de precarga abajo).
    async (valorGrupo: string, fechaOverride?: string) => {
      const grupoLimpio = valorGrupo.trim().toUpperCase()
      if (grupoLimpio !== valorGrupo) setValue('grupo', grupoLimpio)
      if (!grupoLimpio) {
        setBusqueda('formato_invalido')
        void trigger('grupo')
        return
      }
      setBusqueda('buscando')
      const trabajador = await buscarTrabajadorPorGrupo(grupoLimpio, fechaOverride || fecha || hoy())
      if (!trabajador) {
        setBusqueda('no_encontrado')
        return
      }
      // El líder de cosecha del grupo es el sup_cuadrilla de cualquiera de
      // sus trabajadores (no el nombre del trabajador encontrado).
      if (trabajador.sup_cuadrilla) setValue('liderCosecha', trabajador.sup_cuadrilla.toUpperCase())
      if (trabajador.fundo) setValue('fundo', trabajador.fundo.toUpperCase())
      // La zona fija del USUARIO logueado (Administración > Personal por
      // zona) manda siempre sobre la zona detectada por el fundo del grupo
      // ese día.
      if (!zonaUsuario) {
        const zonaDetectada = trabajador.fundo ? zonaDesdeFundo(trabajador.fundo) : null
        if (zonaDetectada) setValue('zona', zonaDetectada)
      }
      setBusqueda('encontrado')
    },
    [fecha, setValue, trigger, zonaUsuario],
  )

  // Viene de "Próximas caminatas" (Compromisos): ?grupo=...&fecha=...
  // precarga y busca solo, igual que ?legajo= en Registrar (Atenciones).
  useEffect(() => {
    const grupoParam = searchParams.get('grupo')
    if (!grupoParam) return
    const fechaParam = searchParams.get('fecha')
    if (fechaParam) setValue('fecha', fechaParam)
    setValue('grupo', grupoParam)
    void buscarPorGrupo(grupoParam, fechaParam || undefined)
    setSearchParams(
      (prev) => {
        prev.delete('grupo')
        prev.delete('fecha')
        return prev
      },
      { replace: true },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function limpiarFormulario() {
    reset()
    setValue('fecha', hoy())
    setValue('tipoAtencion360', [])
    setValue('alertasReportadas', [])
    setBusqueda('idle')
    setFormKey((k) => k + 1)
  }

  async function onSubmit(values: Atencion360FormValues) {
    if (!profile) return
    setErrorGuardado(null)
    setEstadoGuardado('guardando')

    const tipoAtencion = values.tipoAtencion360.includes('OTRAS')
      ? [...values.tipoAtencion360.filter((v) => v !== 'OTRAS'), values.otroTipoAtencion || '']
      : values.tipoAtencion360

    // La zona fija del usuario logueado (Administración > Personal por
    // zona) gana siempre sobre lo que haya en el formulario.
    const zonaFinal = (profile.zona_asignada as Zona | null) ?? values.zona
    const now = new Date().toISOString()

    const atencion: Atencion = {
      id: crypto.randomUUID(),
      client_uuid: crypto.randomUUID(),
      tipo_registro: '360 LABORAL',
      fecha: values.fecha,
      fecha_cierre: values.fecha,
      zona: zonaFinal,
      fundo: values.fundo,
      modulo: esPacking ? values.modulo || null : moduloDesdeFundo(values.fundo),
      grupo: values.grupo,
      area: values.actividad,
      tipo: null,
      categoria: null,
      subcategoria: null,
      falta: null,
      gravedad: values.nivelConflictividad,
      comentarios: values.observaciones,
      involucrados: [],
      estado: 'CERRADO',
      accion_correctiva: null,
      dias_suspension: null,
      detalle_cierre: null,
      sup_cuadrilla: null,
      responsable_id: profile.id,
      responsable_nombre: profile.nombre_completo,
      sup_rrll: supRrllPorZona(zonaFinal),
      reporte: null,
      antecedente: null,
      notas_seguimiento: null,
      lider_cosecha: values.liderCosecha,
      total_encuestado: values.totalEncuestado ?? null,
      tipo_atencion_360: tipoAtencion,
      alertas_reportadas: values.alertasReportadas,
      alertas_360: null,
      // Ya no se pide un detalle ni una acción general: cada alerta trae
      // los suyos (ver AlertasReportadas). compromiso_generado/
      // detalle_compromiso/fecha_fin_compromiso quedan null: la sección
      // "Compromiso" se quitó del formulario (reemplazada por la Acción de
      // cada alerta) y la caminata nace CERRADO. evidencia_360 queda null:
      // la sección "Evidencia" se eliminó del formulario por no usarse.
      detalle_alerta: null,
      compromiso_generado: null,
      detalle_compromiso: null,
      fecha_fin_compromiso: null,
      evidencia_360: null,
      resultado_compromiso: null,
      created_at: now,
      updated_at: now,
    }

    const { error } = await crearAtencion(atencion)
    if (error) {
      setEstadoGuardado('idle')
      setErrorGuardado(`No se pudo guardar: ${error}. Verifica tu conexión e intenta de nuevo.`)
      return
    }
    setEstadoGuardado('guardado')
    limpiarFormulario()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => setEstadoGuardado('idle'), 1500)
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="Registrar caminata" description="Registra una sesión de 360 Laboral con un grupo." />

      <form key={formKey} onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {errorGuardado && (
          <div className="rounded-md bg-red-50 border border-red-200 text-red-800 text-sm px-3 py-2 flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            {errorGuardado}
          </div>
        )}

        <CardSection title="Fecha 360 Laboral" icon={<CalendarDays className="size-4 text-brand" />}>
          <Field label="Fecha del caso" value={fecha} error={errors.fecha?.message}>
            <input type="date" {...register('fecha')} className="input" />
          </Field>
        </CardSection>

        <CardSection title="Nivel de conflictividad" icon={<AlertTriangle className="size-4 text-brand" />}>
          <SegmentedControl
            opciones={NIVELES_CONFLICTIVIDAD}
            valor={valores.nivelConflictividad}
            onChange={(v) => setValue('nivelConflictividad', v, { shouldValidate: true, shouldDirty: true })}
            colorPorOpcion={GRAVEDAD_COLORES}
          />
          {errors.nivelConflictividad && <p className="text-xs text-danger mt-1">{errors.nivelConflictividad.message}</p>}
        </CardSection>

        <CardSection title="Grupo" icon={<UserSearch className="size-4 text-brand" />}>
          <div>
            <label htmlFor="campo-grupo" className="block text-[13px] font-medium text-neutral-700 mb-1.5">
              Número de grupo
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="campo-grupo"
                  type="text"
                  placeholder="CH12"
                  {...conMayusculas(register('grupo', { onChange: () => setBusqueda('idle') }))}
                  className={cn('input', CLASE_INPUT_POR_ESTADO[estadoGrupo], estadoGrupo !== 'neutral' && 'pl-9')}
                />
                {estadoGrupo !== 'neutral' && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    {estadoGrupo === 'success' && <CheckCircle2 className="size-4 text-success" />}
                    {estadoGrupo === 'warning' && <AlertTriangle className="size-4 text-warning" />}
                    {estadoGrupo === 'error' && <AlertCircle className="size-4 text-danger" />}
                  </span>
                )}
              </div>
              <Button type="button" variant="primary" onClick={() => buscarPorGrupo(grupo || '')} loading={busqueda === 'buscando'} className="shrink-0">
                <Search className="size-4" />
                Buscar
              </Button>
            </div>
            {estadoGrupo === 'warning' && errors.grupo && <p className="text-xs text-warning mt-1">{errors.grupo.message}</p>}
            {estadoGrupo === 'error' && errors.grupo && <p className="text-xs text-danger mt-1">{errors.grupo.message}</p>}
            {busqueda === 'encontrado' && (
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="size-3.5 shrink-0" />
                Líder de cosecha, fundo y zona autocompletados desde TAREO — revisa si aplican.
              </p>
            )}
            {busqueda === 'no_encontrado' && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <AlertCircle className="size-3.5 shrink-0" />
                No encontramos ese grupo en el tareo de esa fecha. Completa los datos a mano.
              </p>
            )}
          </div>

          <Field label="Líder de cosecha" value={valores.liderCosecha} error={errors.liderCosecha?.message}>
            <input type="text" {...conMayusculas(register('liderCosecha'))} className="input" />
          </Field>

          <Field label="Total de personal encuestado" value={valores.totalEncuestado} error={errors.totalEncuestado?.message}>
            <input type="number" min={0} {...register('totalEncuestado', { valueAsNumber: true })} className="input" />
          </Field>
        </CardSection>

        <CardSection title="Ubicación" icon={<MapPin className="size-4 text-brand" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Zona"
              value={zona}
              error={errors.zona?.message}
              hint={
                zonaUsuario
                  ? 'Fijada por Personal por zona: todo lo que registras queda siempre en esta zona.'
                  : supRrll
                    ? `Sup. RRLL: ${supRrll}`
                    : undefined
              }
            >
              <select
                {...register('zona')}
                disabled={Boolean(zonaUsuario)}
                className={cn('input', zonaUsuario && 'bg-neutral-100 text-neutral-500 cursor-not-allowed')}
                onChange={(e) => {
                  setValue('zona', e.target.value as never, { shouldValidate: true })
                  setValue('fundo', '')
                  setValue('modulo', '')
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

            {esPacking ? (
              <Field label="Fundo" value={fundo} error={errors.fundo?.message}>
                <select {...register('fundo')} className="input">
                  <option value="">Selecciona...</option>
                  {PACKING_FUNDOS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field label="Fundo" value={fundo} error={errors.fundo?.message} hint={moduloDetectado ? `Módulo detectado: ${moduloDetectado}` : undefined}>
                <input type="text" placeholder="REM 2-W" {...conMayusculas(register('fundo'))} className="input" />
              </Field>
            )}
          </div>

          {esPacking && (
            <Field label="Turno" value={valores.modulo} error={errors.modulo?.message}>
              <select {...register('modulo')} className="input">
                <option value="">Selecciona...</option>
                {TURNOS_360.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </CardSection>

        <CardSection title="Actividad" icon={<ClipboardCheck className="size-4 text-brand" />}>
          <Field label="Actividad realizada" value={valores.actividad} error={errors.actividad?.message}>
            <input type="text" {...conMayusculas(register('actividad'))} className="input" />
          </Field>
        </CardSection>

        <CardSection title="Tipo de atención" icon={<FileWarning className="size-4 text-brand" />}>
          <CheckboxGroup opciones={TIPOS_ATENCION_360} valores={tipoAtencion360} onToggle={(v) => toggle('tipoAtencion360', v)} />
          {errors.tipoAtencion360 && <p className="text-xs text-danger mt-1">{errors.tipoAtencion360.message}</p>}
          {tipoAtencion360.includes('OTRAS') && (
            <Field label="Especifica" value={valores.otroTipoAtencion} error={errors.otroTipoAtencion?.message} className="mt-3">
              <input type="text" {...conMayusculas(register('otroTipoAtencion'))} className="input" />
            </Field>
          )}
        </CardSection>

        <CardSection title="Alertas" icon={<Bell className="size-4 text-brand" />}>
          <AlertasReportadas valores={alertasReportadas} onChange={(v) => setValue('alertasReportadas', v, { shouldValidate: true, shouldDirty: true })} />
          {errors.alertasReportadas && <p className="text-xs text-danger mt-1">{errors.alertasReportadas.message}</p>}
        </CardSection>

        <CardSection title="Observaciones" icon={<StickyNote className="size-4 text-brand" />}>
          <Field label="Observaciones" value={valores.observaciones} error={errors.observaciones?.message}>
            <textarea rows={3} {...conMayusculas(register('observaciones'))} className="input" />
          </Field>
        </CardSection>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className={cn('text-xs font-medium transition-opacity duration-200 text-amber-700', isDirty && estadoGuardado === 'idle' ? 'opacity-100' : 'opacity-0')}>
            ● Cambios sin guardar
          </span>
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Button type="button" variant="secondary" onClick={limpiarFormulario} disabled={isSubmitting}>
              Limpiar formulario
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Registrar caminata'}
            </Button>
          </div>
        </div>
      </form>

      {estadoGuardado !== 'idle' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center gap-3 max-w-xs w-full">
            {estadoGuardado === 'guardando' ? (
              <>
                <Loader2 className="size-10 text-brand animate-spin" />
                <p className="text-sm font-medium text-neutral-700">Guardando...</p>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-10 text-success" />
                <p className="text-sm font-medium text-neutral-800">Caminata registrada</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
