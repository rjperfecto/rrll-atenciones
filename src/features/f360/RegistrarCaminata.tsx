import { useCallback, useMemo, useState } from 'react'
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
  Handshake,
  Loader2,
  MapPin,
  Paperclip,
  ScanLine,
  Search,
  StickyNote,
  UserSearch,
} from 'lucide-react'
import { atencion360Schema, type Atencion360FormValues } from '@/features/atenciones/atencion360Schema'
import { BarcodeScannerModal } from '@/components/ui/BarcodeScannerModal'
import { estadoDeCampo, CLASE_INPUT_POR_ESTADO } from '@/lib/campoEstado'
import { conMayusculas } from '@/lib/conMayusculas'
import { LEGAJO_REGEX } from '@/data/legajo'
import { ZONAS } from '@/data/zonasFundos'
import { PACKING_FUNDOS, TURNOS_360, TIPOS_ATENCION_360, ALERTAS_360 } from '@/data/formulario360'
import { supRrllPorZona } from '@/data/supervisoresRrll'
import { moduloDesdeFundo } from '@/lib/modulo'
import { zonaDesdeFundo } from '@/lib/zonaFundo'
import { buscarTrabajadorPorLegajo, buscarAfiliadoPorLegajo } from '@/lib/trabajadoresApi'
import { obtenerZonaAsignada } from '@/lib/personalZonaApi'
import { crearAtencion, contarTrabajadoresGrupo } from '@/lib/atencionesApi'
import { useAuth } from '@/features/auth/AuthContext'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { CardSection } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import { GRAVEDAD_COLORES } from '@/components/ui/Badge'
import type { Atencion } from '@/types'

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
// en Atenciones; lo único que cambia es que se escanea al SUPERVISOR del
// grupo (autocompleta Líder de cosecha, Grupo y Alcance), no a un
// trabajador puntual. Ver plan: separa 360 Laboral de Atenciones.
export function RegistrarCaminata() {
  const { profile } = useAuth()
  const [estadoGuardado, setEstadoGuardado] = useState<'idle' | 'guardando' | 'guardado'>('idle')
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState<EstadoBusqueda>('idle')
  const [escaneando, setEscaneando] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [zonaAsignada, setZonaAsignada] = useState<string | null>(null)

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
    defaultValues: { tipoRegistro: '360 LABORAL', fecha: hoy(), tipoAtencion360: [], alertas360: [] },
  })

  const valores = watch()
  const { legajoSupervisor, fecha, zona, fundo } = valores
  const esPacking = zona === 'PACKING'
  const moduloDetectado = useMemo(() => (!esPacking && fundo ? moduloDesdeFundo(fundo) : null), [esPacking, fundo])
  const supRrll = useMemo(() => (zona ? supRrllPorZona(zona) : null), [zona])
  const estadoLegajo = estadoDeCampo(legajoSupervisor, errors.legajoSupervisor?.message)
  const tipoAtencion360 = valores.tipoAtencion360 ?? []
  const alertas360 = valores.alertas360 ?? []

  function toggle(campo: 'tipoAtencion360' | 'alertas360', valor: string) {
    const actual: string[] = valores[campo] ?? []
    const siguiente = actual.includes(valor) ? actual.filter((v) => v !== valor) : [...actual, valor]
    setValue(campo, siguiente, { shouldValidate: true, shouldDirty: true })
  }

  const buscarSupervisor = useCallback(
    async (valorLegajo: string) => {
      const legajoLimpio = valorLegajo.trim()
      if (legajoLimpio !== valorLegajo) setValue('legajoSupervisor', legajoLimpio)
      if (!LEGAJO_REGEX.test(legajoLimpio)) {
        setBusqueda('formato_invalido')
        void trigger('legajoSupervisor')
        return
      }
      setBusqueda('buscando')
      const [trabajador, zonaFija] = await Promise.all([
        buscarTrabajadorPorLegajo(legajoLimpio, fecha || hoy()),
        obtenerZonaAsignada(legajoLimpio),
      ])
      setZonaAsignada(zonaFija)
      if (!trabajador) {
        setBusqueda('no_encontrado')
        if (zonaFija) setValue('zona', zonaFija)
        return
      }
      setValue('liderCosecha', trabajador.nombre_completo.toUpperCase())
      if (trabajador.fundo) setValue('fundo', trabajador.fundo.toUpperCase())
      // La zona asignada a la persona manda siempre sobre la zona detectada
      // por el fundo del día (ver Administración > Personal por zona).
      const zonaDetectada = zonaFija ?? (trabajador.fundo ? zonaDesdeFundo(trabajador.fundo) : null)
      if (zonaDetectada) setValue('zona', zonaDetectada)
      if (trabajador.grupo) {
        const grupoDetectado = trabajador.grupo.toUpperCase()
        setValue('grupo', grupoDetectado)
        const total = await contarTrabajadoresGrupo(grupoDetectado, fecha || hoy())
        setValue('alcance', total, { shouldValidate: true })
      }
      setBusqueda('encontrado')
    },
    [fecha, setValue, trigger],
  )

  const onCodigoEscaneado = useCallback(
    (texto: string) => {
      setEscaneando(false)
      setValue('legajoSupervisor', texto)
      void buscarSupervisor(texto)
    },
    [buscarSupervisor, setValue],
  )

  function limpiarFormulario() {
    reset()
    setValue('fecha', hoy())
    setValue('tipoAtencion360', [])
    setValue('alertas360', [])
    setBusqueda('idle')
    setFormKey((k) => k + 1)
  }

  async function onSubmit(values: Atencion360FormValues) {
    if (!profile) return
    setErrorGuardado(null)
    setEstadoGuardado('guardando')

    const compromisoSi = values.compromisoGenerado === 'SI'
    const tipoAtencion = values.tipoAtencion360.includes('OTRAS')
      ? [...values.tipoAtencion360.filter((v) => v !== 'OTRAS'), values.otroTipoAtencion || '']
      : values.tipoAtencion360
    const alertas = values.alertas360.includes('OTRAS')
      ? [...values.alertas360.filter((v) => v !== 'OTRAS'), values.otraAlerta || '']
      : values.alertas360

    // Se recalcula acá (no se confía solo en el estado de "Buscar") por si
    // el usuario escribió el legajo del supervisor y envió sin buscar antes.
    // Igual con la zona: si el legajo tiene zona fija asignada
    // (Administración > Personal por zona), esa gana siempre sobre la que
    // haya quedado seleccionada en el formulario.
    const [, zonaFija] = await Promise.all([
      buscarAfiliadoPorLegajo(values.legajoSupervisor),
      obtenerZonaAsignada(values.legajoSupervisor),
    ])
    const zonaFinal = zonaFija ?? values.zona
    const now = new Date().toISOString()

    const atencion: Atencion = {
      id: crypto.randomUUID(),
      client_uuid: crypto.randomUUID(),
      tipo_registro: '360 LABORAL',
      fecha: values.fecha,
      fecha_cierre: compromisoSi ? null : values.fecha,
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
      estado: compromisoSi ? 'ABIERTO' : 'CERRADO',
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
      alcance: values.alcance ?? null,
      tipo_atencion_360: tipoAtencion,
      alertas_360: alertas,
      detalle_alerta: values.detalleAlerta,
      compromiso_generado: compromisoSi,
      detalle_compromiso: compromisoSi ? values.detalleCompromiso || null : null,
      fecha_fin_compromiso: compromisoSi ? values.fechaFinCompromiso || null : null,
      evidencia_360: values.evidencia360,
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

        <CardSection title="Supervisor del grupo" icon={<UserSearch className="size-4 text-brand" />}>
          <div>
            <label htmlFor="campo-legajo-supervisor" className="block text-[13px] font-medium text-neutral-700 mb-1.5">
              Legajo del supervisor
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="campo-legajo-supervisor"
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="ej. 1012345678"
                  {...register('legajoSupervisor', {
                    onChange: () => {
                      setBusqueda('idle')
                      setZonaAsignada(null)
                    },
                  })}
                  className={cn('input', CLASE_INPUT_POR_ESTADO[estadoLegajo], estadoLegajo !== 'neutral' && 'pl-9')}
                />
                {estadoLegajo !== 'neutral' && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    {estadoLegajo === 'success' && <CheckCircle2 className="size-4 text-success" />}
                    {estadoLegajo === 'warning' && <AlertTriangle className="size-4 text-warning" />}
                    {estadoLegajo === 'error' && <AlertCircle className="size-4 text-danger" />}
                  </span>
                )}
              </div>
              <Button type="button" variant="primary" onClick={() => buscarSupervisor(legajoSupervisor || '')} loading={busqueda === 'buscando'} className="shrink-0">
                <Search className="size-4" />
                Buscar
              </Button>
              <Button type="button" variant="secondary" onClick={() => setEscaneando(true)} className="shrink-0" title="Escanear carnet">
                <ScanLine className="size-4" />
                <span className="hidden sm:inline">Escanear</span>
              </Button>
            </div>
            {estadoLegajo === 'warning' && errors.legajoSupervisor && <p className="text-xs text-warning mt-1">{errors.legajoSupervisor.message}</p>}
            {estadoLegajo === 'error' && errors.legajoSupervisor && <p className="text-xs text-danger mt-1">{errors.legajoSupervisor.message}</p>}
            {busqueda === 'encontrado' && (
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="size-3.5 shrink-0" />
                Líder, grupo, zona y alcance autocompletados desde TAREO — revisa si aplican.
              </p>
            )}
            {busqueda === 'no_encontrado' && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <AlertCircle className="size-3.5 shrink-0" />
                No encontramos ese legajo en el tareo de esa fecha. Completa los datos a mano.
              </p>
            )}
          </div>

          <Field label="Líder de cosecha" value={valores.liderCosecha} error={errors.liderCosecha?.message}>
            <input type="text" {...conMayusculas(register('liderCosecha'))} className="input" />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Grupo" value={valores.grupo} error={errors.grupo?.message}>
              <input type="text" {...conMayusculas(register('grupo'))} className="input" />
            </Field>
            <Field label="Alcance" value={valores.alcance} error={errors.alcance?.message} hint="Cantidad de trabajadores en el grupo (autocompletado)">
              <input type="number" min={0} {...register('alcance', { valueAsNumber: true })} className="input" />
            </Field>
          </div>
        </CardSection>

        <CardSection title="Ubicación" icon={<MapPin className="size-4 text-brand" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Zona"
              value={zona}
              error={errors.zona?.message}
              hint={
                zonaAsignada
                  ? `Fijada por Personal por zona (${zonaAsignada}), aunque aparezca en otra zona hoy.`
                  : supRrll
                    ? `Sup. RRLL: ${supRrll}`
                    : undefined
              }
            >
              <select
                {...register('zona')}
                className="input"
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
                <input type="text" placeholder="ej. REM 2-W" {...conMayusculas(register('fundo'))} className="input" />
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
          <CheckboxGroup opciones={ALERTAS_360} valores={alertas360} onToggle={(v) => toggle('alertas360', v)} />
          {errors.alertas360 && <p className="text-xs text-danger mt-1">{errors.alertas360.message}</p>}
          {alertas360.includes('OTRAS') && (
            <Field label="Especifica" value={valores.otraAlerta} error={errors.otraAlerta?.message} className="mt-3">
              <input type="text" {...conMayusculas(register('otraAlerta'))} className="input" />
            </Field>
          )}
          <Field label="Detalle de la alerta" value={valores.detalleAlerta} error={errors.detalleAlerta?.message} className="mt-3">
            <textarea rows={3} {...conMayusculas(register('detalleAlerta'))} className="input" />
          </Field>
        </CardSection>

        <CardSection title="Compromiso" icon={<Handshake className="size-4 text-brand" />}>
          <SegmentedControl
            opciones={['SI', 'NO'] as const}
            valor={valores.compromisoGenerado}
            onChange={(v) => setValue('compromisoGenerado', v, { shouldValidate: true, shouldDirty: true })}
          />
          {errors.compromisoGenerado && <p className="text-xs text-danger mt-1">{errors.compromisoGenerado.message}</p>}
          {valores.compromisoGenerado === 'SI' && (
            <div className="space-y-4 pt-3">
              <Field label="Detalle del compromiso" value={valores.detalleCompromiso} error={errors.detalleCompromiso?.message}>
                <textarea rows={3} {...conMayusculas(register('detalleCompromiso'))} className="input" />
              </Field>
              <Field label="Fecha fin de compromiso" value={valores.fechaFinCompromiso} error={errors.fechaFinCompromiso?.message}>
                <input type="date" {...register('fechaFinCompromiso')} className="input" />
              </Field>
              <p className="text-xs text-amber-700 flex items-center gap-1.5">
                <AlertCircle className="size-3.5 shrink-0" />
                Este registro va a quedar pendiente en "Compromisos" hasta que se cierre.
              </p>
            </div>
          )}
        </CardSection>

        <CardSection title="Evidencia" icon={<Paperclip className="size-4 text-brand" />}>
          <Field label="Evidencia de 360 laboral" value={valores.evidencia360} error={errors.evidencia360?.message} hint="Referencia o enlace (por ahora no se sube el archivo directamente)">
            <input type="text" {...conMayusculas(register('evidencia360'))} className="input" />
          </Field>
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

      {escaneando && <BarcodeScannerModal onDetected={onCodigoEscaneado} onClose={() => setEscaneando(false)} />}

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
