import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import type { Atencion } from '@/types'

const gravedadColor: Record<string, string> = {
  BAJO: 'bg-emerald-100 text-emerald-800',
  MEDIO: 'bg-amber-100 text-amber-800',
  ALTO: 'bg-red-100 text-red-800',
}

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
    reset({
      fecha: values.fecha,
      esAfiliado: 'NO_ESPECIFICA',
    })
    setBusqueda('idle')
    void pushPending()
    setTimeout(() => setSavedMsg(null), 4000)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-xl">
      {savedMsg && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-3 py-2 flex items-center justify-between gap-2">
          <span>{savedMsg}</span>
          <Link to="/historial" className="underline whitespace-nowrap">
            Ver en historial
          </Link>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Fecha</label>
        <input type="date" {...register('fecha')} className="input" />
        {errors.fecha && <p className="field-error">{errors.fecha.message}</p>}
      </div>

      <fieldset className="border border-neutral-200 rounded-lg p-4 space-y-4">
        <legend className="text-sm font-medium text-neutral-700 px-1">Trabajador involucrado</legend>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Legajo</label>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              {...register('legajo', { onChange: () => setBusqueda('idle') })}
              className="input"
            />
            <button
              type="button"
              onClick={buscarTrabajador}
              disabled={busqueda === 'buscando'}
              className="rounded-md bg-neutral-800 text-white px-4 py-2 text-sm font-medium hover:bg-neutral-700 disabled:opacity-50 whitespace-nowrap"
            >
              {busqueda === 'buscando' ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
          {errors.legajo && <p className="field-error">{errors.legajo.message}</p>}
          {busqueda === 'encontrado' && (
            <p className="text-xs text-emerald-600 mt-1">
              Datos autocompletados desde TAREO — revisa si aplican a este caso.
            </p>
          )}
          {busqueda === 'no_encontrado' && (
            <p className="text-xs text-amber-600 mt-1">
              No hay datos de TAREO para ese legajo en esa fecha o antes. Completa los datos manualmente.
            </p>
          )}
          {busqueda === 'formato_invalido' && (
            <p className="text-xs text-red-600 mt-1">
              El legajo debe tener 10 dígitos y empezar con "10" (ej. 1012345678).
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre completo</label>
          <input type="text" {...register('nombreInvolucrado')} className="input" />
          {errors.nombreInvolucrado && <p className="field-error">{errors.nombreInvolucrado.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">¿Afiliado sindical?</label>
          <select {...register('esAfiliado')} className="input">
            <option value="NO_ESPECIFICA">No especifica</option>
            <option value="SI">Sí</option>
            <option value="NO">No</option>
          </select>
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Zona</label>
          <select {...register('zona')} className="input">
            <option value="">Selecciona...</option>
            {ZONAS.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
          {errors.zona && <p className="field-error">{errors.zona.message}</p>}
          {supRrll && <p className="text-xs text-neutral-500 mt-1">Sup. RRLL: {supRrll}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Fundo</label>
          <input type="text" {...register('fundo')} placeholder="ej. REM 2-W" className="input" />
          {modulo && <p className="text-xs text-neutral-500 mt-1">Módulo detectado: {modulo}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Grupo / cuadrilla</label>
          <input type="text" {...register('grupo')} placeholder="ej. CH12" className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Área / actividad</label>
          <input type="text" {...register('area')} placeholder="ej. Cosecha ARA Granel 3.0 kg" className="input" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Sup. cuadrilla</label>
        <input type="text" {...register('supCuadrilla')} className="input" />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Tipo</label>
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
        {errors.tipo && <p className="field-error">{errors.tipo.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Categoría</label>
          <select
            {...register('categoria')}
            disabled={!tipo}
            className="input disabled:bg-neutral-100"
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
          {errors.categoria && <p className="field-error">{errors.categoria.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Subcategoría</label>
          <select {...register('subcategoria')} disabled={!categoria} className="input disabled:bg-neutral-100">
            <option value="">Selecciona...</option>
            {subcategorias.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {errors.subcategoria && <p className="field-error">{errors.subcategoria.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Falta (detalle específico)</label>
        <input type="text" {...register('falta')} placeholder="ej. Fruta con defecto" className="input" />
      </div>

      {gravedad && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-neutral-500">Gravedad (automática):</span>
          <span className={`px-2 py-0.5 rounded-full font-medium text-xs ${gravedadColor[gravedad]}`}>
            {gravedad}
          </span>
        </div>
      )}

      <fieldset className="border border-neutral-200 rounded-lg p-4 space-y-4">
        <legend className="text-sm font-medium text-neutral-700 px-1">Seguimiento (opcional)</legend>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Reporte</label>
            <input type="text" {...register('reporte')} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Antecedente</label>
            <input type="text" {...register('antecedente')} className="input" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Notas de seguimiento</label>
          <input
            type="text"
            {...register('notasSeguimiento')}
            placeholder="ej. Vacaciones 6-26/04"
            className="input"
          />
        </div>
      </fieldset>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Comentarios</label>
        <textarea {...register('comentarios')} rows={3} className="input" />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto rounded-md bg-brand text-white px-6 py-2 text-sm font-medium hover:bg-brand-light disabled:opacity-50"
      >
        {isSubmitting ? 'Guardando...' : 'Registrar atención'}
      </button>
    </form>
  )
}
