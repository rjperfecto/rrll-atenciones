import { useCallback, useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { AlertCircle, AlertTriangle, CheckCircle2, FileWarning, Lock, MapPin, ScanLine, Search, StickyNote, UserSearch } from 'lucide-react'
import { BarcodeScannerModal } from '@/components/ui/BarcodeScannerModal'
import { estadoDeCampo, CLASE_INPUT_POR_ESTADO } from '@/lib/campoEstado'
import { conMayusculas } from '@/lib/conMayusculas'
import { TIPOS, categoriasPorTipo, subcategoriasPorCategoria, gravedadDe } from '@/data/categorizacion'
import { ZONAS } from '@/data/zonasFundos'
import { LEGAJO_REGEX } from '@/data/legajo'
import { supRrllPorZona } from '@/data/supervisoresRrll'
import { moduloDesdeFundo } from '@/lib/modulo'
import { zonaDesdeFundo } from '@/lib/zonaFundo'
import { buscarTrabajadorPorLegajo, buscarAfiliadoPorLegajo } from '@/lib/trabajadoresApi'
import { areaDeActividad } from '@/lib/actividadAreaApi'
import { useAuth } from '@/features/auth/AuthContext'
import { CardSection } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { GravedadBadge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import type { AtencionFormValues } from './atencionSchema'

type EstadoBusqueda = 'idle' | 'buscando' | 'encontrado' | 'no_encontrado' | 'formato_invalido'

// Cuerpo del formulario GENERAL/COSECHA (extraído de AtencionForm.tsx): la
// única diferencia entre esos dos tipos de registro es la etiqueta elegida
// arriba, comparten exactamente estos campos.
export function FormularioGeneral() {
  const [busqueda, setBusqueda] = useState<EstadoBusqueda>('idle')
  const [escaneando, setEscaneando] = useState(false)
  const [esAfiliado, setEsAfiliado] = useState<boolean | null>(null)
  const { profile } = useAuth()
  const zonaUsuario = profile?.zona_asignada ?? null

  const {
    register,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useFormContext<AtencionFormValues>()

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

  const buscarPorLegajo = useCallback(
    async (valorLegajo: string) => {
      const legajoLimpio = valorLegajo.trim()
      if (legajoLimpio !== valorLegajo) setValue('legajo', legajoLimpio)
      if (!LEGAJO_REGEX.test(legajoLimpio)) {
        setBusqueda('formato_invalido')
        setEsAfiliado(null)
        void trigger('legajo')
        return
      }
      setBusqueda('buscando')
      const [esAfiliadoEncontrado, trabajador] = await Promise.all([
        buscarAfiliadoPorLegajo(legajoLimpio),
        buscarTrabajadorPorLegajo(legajoLimpio, fecha ?? ''),
      ])
      setEsAfiliado(esAfiliadoEncontrado)
      if (!trabajador) {
        setBusqueda('no_encontrado')
        return
      }
      setValue('nombreInvolucrado', trabajador.nombre_completo.toUpperCase())
      if (trabajador.fundo) setValue('fundo', trabajador.fundo.toUpperCase())
      // La zona fija del USUARIO logueado (Administración > Personal por
      // zona) manda siempre sobre la zona detectada por el fundo del
      // trabajador ese día: si cvalencia tiene Zona 1 asignada, todo lo que
      // registre queda en Zona 1 aunque el trabajador esté ese día en un
      // fundo de otra zona.
      if (!zonaUsuario) {
        const zonaDetectada = trabajador.fundo ? zonaDesdeFundo(trabajador.fundo) : null
        if (zonaDetectada) setValue('zona', zonaDetectada)
      }
      if (trabajador.grupo) setValue('grupo', trabajador.grupo.toUpperCase())
      if (trabajador.sup_cuadrilla) setValue('supCuadrilla', trabajador.sup_cuadrilla.toUpperCase())
      if (trabajador.area) {
        // La actividad cruda de TAREO (ej. "INSPECCION CALIDAD – CAE") se
        // traduce a Área (ej. "CALIDAD") vía el catálogo Actividad->Área
        // (Excel ACTIVIDADES-AREA). Si la actividad no está en el catálogo
        // todavía (casos ambiguos sin clasificar), se usa el texto crudo.
        const areaMapeada = await areaDeActividad(trabajador.area)
        setValue('area', (areaMapeada ?? trabajador.area).toUpperCase())
      }
      setBusqueda('encontrado')
    },
    [fecha, setValue, trigger, zonaUsuario],
  )

  const onCodigoEscaneado = useCallback(
    (texto: string) => {
      setEscaneando(false)
      setValue('legajo', texto)
      void buscarPorLegajo(texto)
    },
    [buscarPorLegajo, setValue],
  )

  return (
    <>
      <CardSection title="Trabajador involucrado" icon={<UserSearch className="size-4 text-brand" />}>
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
            <Button type="button" variant="primary" onClick={() => buscarPorLegajo(legajo || '')} loading={busqueda === 'buscando'} className="shrink-0">
              <Search className="size-4" />
              Buscar
            </Button>
            <Button type="button" variant="secondary" onClick={() => setEscaneando(true)} className="shrink-0" title="Escanear carnet">
              <ScanLine className="size-4" />
              <span className="hidden sm:inline">Escanear</span>
            </Button>
          </div>
          {estadoLegajo === 'warning' && errors.legajo && <p className="text-xs text-warning mt-1">{errors.legajo.message}</p>}
          {estadoLegajo === 'error' && errors.legajo && <p className="text-xs text-danger mt-1">{errors.legajo.message}</p>}
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
          <input type="text" placeholder="EJ. JUAN PÉREZ LÓPEZ" {...conMayusculas(register('nombreInvolucrado'))} className="input" />
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
            <select {...register('zona')} disabled={Boolean(zonaUsuario)} className={cn('input', zonaUsuario && 'bg-neutral-100 text-neutral-500 cursor-not-allowed')}>
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
          <Field label="Área" value={valores.area}>
            <input type="text" placeholder="ej. COSECHA" {...conMayusculas(register('area'))} className="input" />
          </Field>
        </div>
        <Field label="Líder de Cosecha" value={valores.supCuadrilla}>
          <input type="text" {...conMayusculas(register('supCuadrilla'))} className="input" />
        </Field>
      </CardSection>

      <CardSection title="Tipo de atención" icon={<FileWarning className="size-4 text-brand" />}>
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
            <select {...register('subcategoria')} disabled={!categoria} className="input">
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

      <CardSection title="Seguimiento (opcional)" icon={<StickyNote className="size-4 text-brand" />}>
        <Field label="Reporta" value={valores.reporte}>
          <input type="text" {...conMayusculas(register('reporte'))} className="input" />
        </Field>
        <Field label="Comentarios" value={valores.comentarios}>
          <textarea rows={3} placeholder="Detalle narrativo del caso..." {...conMayusculas(register('comentarios'))} className="input" />
        </Field>
      </CardSection>

      {escaneando && <BarcodeScannerModal onDetected={onCodigoEscaneado} onClose={() => setEscaneando(false)} />}
    </>
  )
}
