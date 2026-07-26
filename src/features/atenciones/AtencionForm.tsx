import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  FileWarning,
  Loader2,
  Lock,
  MapPin,
  ScanLine,
  Search,
  StickyNote,
  UserSearch,
} from 'lucide-react'
import { BarcodeScannerModal } from '@/components/ui/BarcodeScannerModal'
import { estadoDeCampo, CLASE_INPUT_POR_ESTADO } from '@/lib/campoEstado'
import { atencionSchema, type AtencionFormValues } from './atencionSchema'
import { TIPOS, categoriasPorTipo, subcategoriasPorCategoria, gravedadDe } from '@/data/categorizacion'
import { ZONAS } from '@/data/zonasFundos'
import { dniDesdeLegajo, LEGAJO_REGEX } from '@/data/legajo'
import { supRrllPorZona } from '@/data/supervisoresRrll'
import { moduloDesdeFundo } from '@/lib/modulo'
import { zonaDesdeFundo } from '@/lib/zonaFundo'
import { buscarTrabajadorPorLegajo, buscarAfiliadoPorLegajo } from '@/lib/trabajadoresApi'
import { crearAtencion } from '@/lib/atencionesApi'
import { useAuth } from '@/features/auth/AuthContext'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { CardSection } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { GravedadBadge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { Stepper, type PasoStepper } from '@/components/ui/Stepper'
import type { Atencion } from '@/types'

type EstadoBusqueda = 'idle' | 'buscando' | 'encontrado' | 'no_encontrado' | 'formato_invalido'

const PASOS: PasoStepper[] = [
  { id: 'seccion-fecha', label: 'Fecha', icon: <CalendarDays className="size-3" /> },
  { id: 'seccion-trabajador', label: 'Trabajador', icon: <UserSearch className="size-3" /> },
  { id: 'seccion-ubicacion', label: 'Ubicación', icon: <MapPin className="size-3" /> },
  { id: 'seccion-tipo', label: 'Tipo', icon: <FileWarning className="size-3" /> },
  { id: 'seccion-seguimiento', label: 'Seguimiento', icon: <StickyNote className="size-3" /> },
]

// Convierte a mayúsculas mientras se escribe (no solo visualmente: el valor
// que guarda react-hook-form también queda en mayúscula), para los campos de
// texto libre del negocio (nombre, fundo, grupo, área, etc.). Legajo/fecha/
// selects quedan afuera porque no aplica (numérico, catálogos ya en mayúscula).
function conMayusculas(campo: UseFormRegisterReturn) {
  return {
    ...campo,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.target.value = e.target.value.toUpperCase()
      return campo.onChange(e)
    },
  }
}

export function AtencionForm() {
  const { profile } = useAuth()
  const [estadoGuardado, setEstadoGuardado] = useState<'idle' | 'guardando' | 'guardado'>('idle')
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState<EstadoBusqueda>('idle')
  const [escaneando, setEscaneando] = useState(false)
  const [esAfiliado, setEsAfiliado] = useState<boolean | null>(null)
  const [seccionActiva, setSeccionActiva] = useState(PASOS[0].id)
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    trigger,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AtencionFormValues>({
    resolver: zodResolver(atencionSchema),
    mode: 'onTouched', // valida al salir de un campo, no solo al enviar
    defaultValues: {
      fecha: new Date().toISOString().slice(0, 10),
    },
  })

  const valores = watch()
  const { legajo, fecha, tipo, categoria, subcategoria, zona, fundo } = valores

  const categorias = useMemo(() => (tipo ? categoriasPorTipo(tipo) : []), [tipo])
  const subcategorias = useMemo(
    () => (tipo && categoria ? subcategoriasPorCategoria(tipo, categoria) : []),
    [tipo, categoria],
  )
  const gravedad = useMemo(
    () => (tipo && categoria && subcategoria ? gravedadDe(tipo, categoria, subcategoria) : undefined),
    [tipo, categoria, subcategoria],
  )
  const modulo = useMemo(() => (fundo ? moduloDesdeFundo(fundo) : null), [fundo])
  const supRrll = useMemo(() => (zona ? supRrllPorZona(zona) : null), [zona])
  const estadoLegajo = estadoDeCampo(legajo, errors.legajo?.message)

  // Resalta en el Stepper la sección visible en pantalla (scroll-spy): es
  // solo orientación, ningún campo se bloquea por "no haber llegado" a un paso.
  useEffect(() => {
    const secciones = PASOS.map((p) => document.getElementById(p.id)).filter((el): el is HTMLElement => el !== null)
    if (secciones.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visibles = entries.filter((e) => e.isIntersecting)
        if (visibles.length === 0) return
        const masArriba = visibles.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b))
        setSeccionActiva(masArriba.target.id)
      },
      { rootMargin: '-96px 0px -75% 0px', threshold: [0, 0.25, 0.5, 1] },
    )
    secciones.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  function irASeccion(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const buscarPorLegajo = useCallback(
    async (valorLegajo: string) => {
      const legajoLimpio = valorLegajo.trim()
      if (legajoLimpio !== valorLegajo) setValue('legajo', legajoLimpio)
      if (!LEGAJO_REGEX.test(legajoLimpio)) {
        setBusqueda('formato_invalido')
        setEsAfiliado(null)
        void trigger('legajo') // fuerza a mostrar el error aunque el usuario no haya salido del campo
        return
      }
      setBusqueda('buscando')
      // La afiliación no depende de la fecha del caso, solo del legajo: se
      // resuelve aparte del historial de TAREO (que sí es por Legajo+Fecha).
      const [esAfiliadoEncontrado, trabajador] = await Promise.all([
        buscarAfiliadoPorLegajo(legajoLimpio),
        // Busca el registro de TAREO de ese legajo tal como estaba EN la fecha
        // del caso: si no hay marcación exacta ese día, usa la más cercana
        // anterior (nunca una posterior a la fecha de la atención).
        buscarTrabajadorPorLegajo(legajoLimpio, fecha),
      ])
      setEsAfiliado(esAfiliadoEncontrado)
      if (!trabajador) {
        setBusqueda('no_encontrado')
        return
      }
      setValue('nombreInvolucrado', trabajador.nombre_completo.toUpperCase())
      if (trabajador.fundo) {
        setValue('fundo', trabajador.fundo.toUpperCase())
        const zonaDetectada = zonaDesdeFundo(trabajador.fundo)
        if (zonaDetectada) setValue('zona', zonaDetectada)
      }
      if (trabajador.grupo) setValue('grupo', trabajador.grupo.toUpperCase())
      if (trabajador.sup_cuadrilla) setValue('supCuadrilla', trabajador.sup_cuadrilla.toUpperCase())
      if (trabajador.area) setValue('area', trabajador.area.toUpperCase())
      setBusqueda('encontrado')
    },
    [fecha, setValue, trigger],
  )

  const onCodigoEscaneado = useCallback(
    (texto: string) => {
      setEscaneando(false)
      setValue('legajo', texto)
      void buscarPorLegajo(texto)
    },
    [buscarPorLegajo, setValue],
  )

  function limpiarFormulario() {
    // reset(valoresParciales) no limpia los campos no incluidos en esta
    // version de react-hook-form (se probó y confirmó); reset() sin
    // argumentos sí limpia todo, y luego se fija la fecha de hoy aparte.
    reset()
    setValue('fecha', new Date().toISOString().slice(0, 10))
    setBusqueda('idle')
    setEsAfiliado(null)
  }

  async function onSubmit(values: AtencionFormValues) {
    if (!profile) return
    setErrorGuardado(null)
    const gravedadFinal = gravedadDe(values.tipo, values.categoria, values.subcategoria)
    if (!gravedadFinal) return
    setEstadoGuardado('guardando')

    // Se recalcula aquí (no se confía solo en el estado de "Buscar") por si
    // el usuario escribió el legajo y envió el formulario sin buscar antes.
    const esAfiliadoFinal = await buscarAfiliadoPorLegajo(values.legajo)

    const now = new Date().toISOString()
    const atencion: Atencion = {
      id: crypto.randomUUID(),
      client_uuid: crypto.randomUUID(),
      fecha: values.fecha,
      fecha_cierre: null,
      zona: values.zona,
      fundo: values.fundo || null,
      modulo: values.fundo ? moduloDesdeFundo(values.fundo) : null,
      grupo: values.grupo || null,
      area: values.area || null,
      tipo: values.tipo,
      categoria: values.categoria,
      subcategoria: values.subcategoria,
      falta: null,
      gravedad: gravedadFinal,
      comentarios: values.comentarios || null,
      involucrados: [
        {
          legajo: values.legajo,
          dni: dniDesdeLegajo(values.legajo),
          nombre_completo: values.nombreInvolucrado,
          es_afiliado: esAfiliadoFinal,
        },
      ],
      estado: 'ABIERTO',
      accion_correctiva: null,
      dias_suspension: null,
      detalle_cierre: null,
      sup_cuadrilla: values.supCuadrilla || null,
      responsable_id: profile.id,
      responsable_nombre: profile.nombre_completo,
      sup_rrll: supRrllPorZona(values.zona),
      reporte: values.reporte || null,
      antecedente: null,
      notas_seguimiento: null,
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
      <PageHeader title="Nueva atención" description="Registra un caso de RRLL en campo." />

      <Stepper pasos={PASOS} activo={seccionActiva} onIrA={irASeccion} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {errorGuardado && (
          <div className="rounded-md bg-red-50 border border-red-200 text-red-800 text-sm px-3 py-2 flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            {errorGuardado}
          </div>
        )}

        <CardSection id="seccion-fecha" title="Fecha" icon={<CalendarDays className="size-4 text-brand" />}>
          <Field label="Fecha del caso" value={fecha} error={errors.fecha?.message}>
            <input type="date" {...register('fecha')} className="input" />
          </Field>
        </CardSection>

        <CardSection id="seccion-trabajador" title="Trabajador involucrado" icon={<UserSearch className="size-4 text-brand" />}>
          <div>
            <label htmlFor="campo-legajo" className="block text-[13px] font-medium text-neutral-700 mb-1.5">
              Legajo
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="campo-legajo"
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="ej. 1012345678"
                  {...register('legajo', {
                    onChange: () => {
                      setBusqueda('idle')
                      setEsAfiliado(null)
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
              <Button
                type="button"
                variant="primary"
                onClick={() => buscarPorLegajo(legajo || '')}
                loading={busqueda === 'buscando'}
                className="shrink-0"
              >
                <Search className="size-4" />
                Buscar
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEscaneando(true)}
                className="shrink-0"
                title="Escanear carnet"
              >
                <ScanLine className="size-4" />
                <span className="hidden sm:inline">Escanear</span>
              </Button>
            </div>
            {estadoLegajo === 'warning' && errors.legajo && (
              <p className="text-xs text-warning mt-1">{errors.legajo.message}</p>
            )}
            {estadoLegajo === 'error' && errors.legajo && (
              <p className="text-xs text-danger mt-1">{errors.legajo.message}</p>
            )}
            {busqueda === 'encontrado' && (
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="size-3.5 shrink-0" />
                Datos autocompletados desde TAREO — revisa si aplican a este caso.
              </p>
            )}
            {busqueda === 'no_encontrado' && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <AlertCircle className="size-3.5 shrink-0" />
                No encontramos ese legajo en el tareo de esa fecha. Verifica el número o completa los datos a mano.
              </p>
            )}
          </div>

          <Field label="Nombre completo" value={valores.nombreInvolucrado} error={errors.nombreInvolucrado?.message}>
            <input
              type="text"
              placeholder="EJ. JUAN PÉREZ LÓPEZ"
              {...conMayusculas(register('nombreInvolucrado'))}
              className="input"
            />
          </Field>

          <div>
            <label htmlFor="campo-afiliado" className="flex items-center gap-1.5 text-[13px] font-medium text-neutral-700 mb-1.5">
              ¿Afiliado?
              <Lock className="size-3 text-neutral-400" aria-hidden="true" />
            </label>
            <input
              id="campo-afiliado"
              type="text"
              readOnly
              disabled
              value={esAfiliado === null ? '' : esAfiliado ? 'SI' : 'NO'}
              placeholder="Se completa al buscar el legajo"
              className="input bg-neutral-100 text-neutral-500 cursor-not-allowed"
            />
            <p className="text-xs text-neutral-400 mt-1">Solo lectura: se toma de la lista de afiliados, no se edita aquí.</p>
          </div>
        </CardSection>

        <CardSection id="seccion-ubicacion" title="Ubicación" icon={<MapPin className="size-4 text-brand" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Zona" value={zona} error={errors.zona?.message} hint={supRrll ? `Sup. RRLL: ${supRrll}` : undefined}>
              <select {...register('zona')} className="input">
                <option value="">Selecciona...</option>
                {ZONAS.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fundo" value={fundo} hint={modulo ? `Módulo detectado: ${modulo}` : undefined}>
              <input type="text" placeholder="ej. REM 2-W" {...conMayusculas(register('fundo'))} className="input" />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Grupo / cuadrilla" value={valores.grupo}>
              <input type="text" placeholder="ej. CH12" {...conMayusculas(register('grupo'))} className="input" />
            </Field>
            <Field label="Área / actividad" value={valores.area}>
              <input
                type="text"
                placeholder="ej. Cosecha ARA Granel 3.0 kg"
                {...conMayusculas(register('area'))}
                className="input"
              />
            </Field>
          </div>
          <Field label="Sup. cuadrilla" value={valores.supCuadrilla}>
            <input type="text" {...conMayusculas(register('supCuadrilla'))} className="input" />
          </Field>
        </CardSection>

        <CardSection id="seccion-tipo" title="Tipo de atención" icon={<FileWarning className="size-4 text-brand" />}>
          <Field label="Tipo" value={tipo} error={errors.tipo?.message}>
            <select
              {...register('tipo')}
              className="input"
              onChange={(e) => {
                setValue('tipo', e.target.value as AtencionFormValues['tipo'])
                setValue('categoria', '')
                setValue('subcategoria', '')
              }}
            >
              <option value="">Selecciona...</option>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Categoría" value={categoria} error={errors.categoria?.message}>
              <select
                {...register('categoria')}
                disabled={!tipo}
                className="input"
                onChange={(e) => {
                  setValue('categoria', e.target.value)
                  setValue('subcategoria', '')
                }}
              >
                <option value="">Selecciona...</option>
                {categorias.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Subcategoría" value={subcategoria} error={errors.subcategoria?.message}>
              <select
                {...register('subcategoria')}
                disabled={!categoria}
                className="input"
              >
                <option value="">Selecciona...</option>
                {subcategorias.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {gravedad && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-neutral-500">Gravedad (automática):</span>
              <GravedadBadge gravedad={gravedad} />
            </div>
          )}
        </CardSection>

        <CardSection id="seccion-seguimiento" title="Seguimiento (opcional)" icon={<StickyNote className="size-4 text-brand" />}>
          <Field label="Reporta" value={valores.reporte}>
            <input type="text" {...conMayusculas(register('reporte'))} className="input" />
          </Field>
          <Field label="Comentarios" value={valores.comentarios}>
            <textarea
              rows={3}
              placeholder="Detalle narrativo del caso..."
              {...conMayusculas(register('comentarios'))}
              className="input"
            />
          </Field>
        </CardSection>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span
            className={cn(
              'text-xs font-medium transition-opacity duration-200 text-amber-700',
              isDirty && estadoGuardado === 'idle' ? 'opacity-100' : 'opacity-0',
            )}
          >
            ● Cambios sin guardar
          </span>
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Button type="button" variant="secondary" onClick={limpiarFormulario} disabled={isSubmitting}>
              Limpiar formulario
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Registrar atención'}
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
                <p className="text-sm font-medium text-neutral-800">Atención registrada</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
