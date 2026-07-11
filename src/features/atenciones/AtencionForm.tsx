import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  FileWarning,
  MapPin,
  Search,
  StickyNote,
  UserSearch,
} from 'lucide-react'
import { atencionSchema, type AtencionFormValues } from './atencionSchema'
import { TIPOS, categoriasPorTipo, subcategoriasPorCategoria, gravedadDe } from '@/data/categorizacion'
import { ZONAS } from '@/data/zonasFundos'
import { dniDesdeLegajo, LEGAJO_REGEX } from '@/data/legajo'
import { supRrllPorZona } from '@/data/supervisoresRrll'
import { moduloDesdeFundo } from '@/lib/modulo'
import { zonaDesdeFundo } from '@/lib/zonaFundo'
import { db } from '@/lib/db'
import { pushPending } from '@/lib/sync'
import { useAuth } from '@/features/auth/AuthContext'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { CardSection } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { GravedadBadge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import type { Atencion } from '@/types'

type EstadoBusqueda = 'idle' | 'buscando' | 'encontrado' | 'no_encontrado' | 'formato_invalido'

export function AtencionForm() {
  const { profile } = useAuth()
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState<EstadoBusqueda>('idle')
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AtencionFormValues>({
    resolver: zodResolver(atencionSchema),
    mode: 'onTouched', // valida al salir de un campo, no solo al enviar
    defaultValues: {
      fecha: new Date().toISOString().slice(0, 10),
      esAfiliado: 'NO_ESPECIFICA',
    },
  })

  const legajo = watch('legajo')
  const fecha = watch('fecha')
  const tipo = watch('tipo')
  const categoria = watch('categoria')
  const subcategoria = watch('subcategoria')
  const zona = watch('zona')
  const fundo = watch('fundo')

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

  async function buscarTrabajador() {
    const legajoLimpio = (legajo || '').trim()
    if (legajoLimpio !== legajo) setValue('legajo', legajoLimpio)
    if (!LEGAJO_REGEX.test(legajoLimpio)) {
      setBusqueda('formato_invalido')
      return
    }
    setBusqueda('buscando')
    // Busca el registro de TAREO de ese legajo tal como estaba EN la fecha del
    // caso: si no hay marcación exacta ese día, usa la más cercana anterior
    // (nunca una posterior a la fecha de la atención).
    const registros = await db.trabajadoresHistorial.where('legajo').equals(legajoLimpio).toArray()
    const candidatos = registros.filter((r) => r.fecha <= fecha).sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
    const trabajador = candidatos[0]
    if (!trabajador) {
      setBusqueda('no_encontrado')
      return
    }
    setValue('nombreInvolucrado', trabajador.nombre_completo)
    if (trabajador.fundo) {
      setValue('fundo', trabajador.fundo)
      const zonaDetectada = zonaDesdeFundo(trabajador.fundo)
      if (zonaDetectada) setValue('zona', zonaDetectada)
    }
    if (trabajador.grupo) setValue('grupo', trabajador.grupo)
    if (trabajador.sup_cuadrilla) setValue('supCuadrilla', trabajador.sup_cuadrilla)
    if (trabajador.area) setValue('area', trabajador.area)
    setBusqueda('encontrado')
  }

  function limpiarFormulario() {
    reset({
      fecha: new Date().toISOString().slice(0, 10),
      esAfiliado: 'NO_ESPECIFICA',
    })
    setBusqueda('idle')
  }

  async function onSubmit(values: AtencionFormValues) {
    if (!profile) return
    const gravedadFinal = gravedadDe(values.tipo, values.categoria, values.subcategoria)
    if (!gravedadFinal) return

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
      falta: values.falta || null,
      gravedad: gravedadFinal,
      comentarios: values.comentarios || null,
      involucrados: [
        {
          legajo: values.legajo,
          dni: dniDesdeLegajo(values.legajo),
          nombre_completo: values.nombreInvolucrado,
          es_afiliado: values.esAfiliado === 'NO_ESPECIFICA' ? null : values.esAfiliado === 'SI',
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
      antecedente: values.antecedente || null,
      notas_seguimiento: values.notasSeguimiento || null,
      created_at: now,
      updated_at: now,
      synced: false,
    }

    await db.atenciones.add(atencion)
    setSavedMsg(navigator.onLine ? 'Guardado. Sincronizando...' : 'Guardado localmente. Se sincronizará cuando haya conexión.')
    limpiarFormulario()
    void pushPending()
    setTimeout(() => setSavedMsg(null), 4000)
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="Nueva atención" description="Registra un caso de RRLL en campo." />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {savedMsg && (
          <div className="rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-3 py-2 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0" />
              {savedMsg}
            </span>
            <Link to="/historial" className="underline whitespace-nowrap">
              Ver en historial
            </Link>
          </div>
        )}

        <CardSection title="Fecha" icon={<CalendarDays className="size-4 text-brand" />}>
          <Field label="Fecha del caso" error={errors.fecha?.message}>
            <input type="date" {...register('fecha')} className={cn('input', errors.fecha && 'input-error')} />
          </Field>
        </CardSection>

        <CardSection title="Trabajador involucrado" icon={<UserSearch className="size-4 text-brand" />}>
          <Field label="Legajo" error={errors.legajo?.message}>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                placeholder="ej. 1012345678"
                {...register('legajo', { onChange: () => setBusqueda('idle') })}
                className={cn('input', errors.legajo && 'input-error')}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={buscarTrabajador}
                loading={busqueda === 'buscando'}
                className="shrink-0"
              >
                <Search className="size-4" />
                Buscar
              </Button>
            </div>
            {busqueda === 'encontrado' && (
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="size-3.5 shrink-0" />
                Datos autocompletados desde TAREO — revisa si aplican a este caso.
              </p>
            )}
            {busqueda === 'no_encontrado' && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <AlertCircle className="size-3.5 shrink-0" />
                No hay datos de TAREO para ese legajo en esa fecha o antes. Completa los datos manualmente.
              </p>
            )}
            {busqueda === 'formato_invalido' && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="size-3.5 shrink-0" />
                El legajo debe tener 10 dígitos y empezar con "10" (ej. 1012345678).
              </p>
            )}
          </Field>

          <Field label="Nombre completo" error={errors.nombreInvolucrado?.message}>
            <input
              type="text"
              placeholder="ej. Juan Pérez López"
              {...register('nombreInvolucrado')}
              className={cn('input', errors.nombreInvolucrado && 'input-error')}
            />
          </Field>

          <Field label="¿Afiliado sindical?">
            <select {...register('esAfiliado')} className="input">
              <option value="NO_ESPECIFICA">No especifica</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </Field>
        </CardSection>

        <CardSection title="Ubicación" icon={<MapPin className="size-4 text-brand" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Zona" error={errors.zona?.message} hint={supRrll ? `Sup. RRLL: ${supRrll}` : undefined}>
              <select {...register('zona')} className={cn('input', errors.zona && 'input-error')}>
                <option value="">Selecciona...</option>
                {ZONAS.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fundo" hint={modulo ? `Módulo detectado: ${modulo}` : 'ej. REM 2-W'}>
              <input type="text" placeholder="ej. REM 2-W" {...register('fundo')} className="input" />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Grupo / cuadrilla">
              <input type="text" placeholder="ej. CH12" {...register('grupo')} className="input" />
            </Field>
            <Field label="Área / actividad">
              <input
                type="text"
                placeholder="ej. Cosecha ARA Granel 3.0 kg"
                {...register('area')}
                className="input"
              />
            </Field>
          </div>
          <Field label="Sup. cuadrilla">
            <input type="text" {...register('supCuadrilla')} className="input" />
          </Field>
        </CardSection>

        <CardSection title="Tipo de atención" icon={<FileWarning className="size-4 text-brand" />}>
          <Field label="Tipo" error={errors.tipo?.message}>
            <select
              {...register('tipo')}
              className={cn('input', errors.tipo && 'input-error')}
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
            <Field label="Categoría" error={errors.categoria?.message}>
              <select
                {...register('categoria')}
                disabled={!tipo}
                className={cn('input', errors.categoria && 'input-error')}
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
            <Field label="Subcategoría" error={errors.subcategoria?.message}>
              <select
                {...register('subcategoria')}
                disabled={!categoria}
                className={cn('input', errors.subcategoria && 'input-error')}
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

          <Field label="Falta (detalle específico)">
            <input type="text" placeholder="ej. Fruta con defecto" {...register('falta')} className="input" />
          </Field>

          {gravedad && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-neutral-500">Gravedad (automática):</span>
              <GravedadBadge gravedad={gravedad} />
            </div>
          )}
        </CardSection>

        <CardSection title="Seguimiento (opcional)" icon={<StickyNote className="size-4 text-brand" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Reporte">
              <input type="text" {...register('reporte')} className="input" />
            </Field>
            <Field label="Antecedente">
              <input type="text" {...register('antecedente')} className="input" />
            </Field>
          </div>
          <Field label="Notas de seguimiento">
            <input
              type="text"
              placeholder="ej. Vacaciones 6-26/04"
              {...register('notasSeguimiento')}
              className="input"
            />
          </Field>
          <Field label="Comentarios">
            <textarea rows={3} placeholder="Detalle narrativo del caso..." {...register('comentarios')} className="input" />
          </Field>
        </CardSection>

        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <Button type="button" variant="secondary" onClick={limpiarFormulario} disabled={isSubmitting}>
            Limpiar formulario
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Registrar atención'}
          </Button>
        </div>
      </form>
    </div>
  )
}
