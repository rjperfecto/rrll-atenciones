import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileWarning,
  History,
  Lock,
  MapPin,
  ScanLine,
  Search,
  StickyNote,
  UserSearch,
} from 'lucide-react'
import { BarcodeScannerModal } from '@/components/ui/BarcodeScannerModal'
import { estadoDeCampo, CLASE_INPUT_POR_ESTADO } from '@/lib/campoEstado'
import { conMayusculas } from '@/lib/conMayusculas'
import { TIPOS, categoriasPorTipo, subcategoriasPorCategoria, gravedadDe } from '@/data/categorizacion'
import { ZONAS } from '@/data/zonasFundos'
import { LEGAJO_REGEX } from '@/data/legajo'
import { ACCIONES_CORRECTIVAS, requiereDias, requiereCompromiso } from '@/data/accionCorrectiva'
import { supRrllPorZona } from '@/data/supervisoresRrll'
import { moduloDesdeFundo } from '@/lib/modulo'
import { zonaDesdeFundo } from '@/lib/zonaFundo'
import { buscarTrabajadorPorLegajo, buscarAfiliadoPorLegajo } from '@/lib/trabajadoresApi'
import { areaDeActividad } from '@/lib/actividadAreaApi'
import { buscarAntecedentesPorLegajo, type AntecedenteFalta } from '@/lib/atencionesApi'
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
  const [antecedentes, setAntecedentes] = useState<AntecedenteFalta[] | null>(null)
  const { profile } = useAuth()
  const zonaUsuario = profile?.zona_asignada ?? null
  const [searchParams, setSearchParams] = useSearchParams()

  const {
    register,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useFormContext<AtencionFormValues>()

  const valores = watch()
  const { legajo, fecha, tipo, categoria, subcategoria, zona, fundo, accionCorrectiva } = valores

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
  // Personal de Packing (zona_asignada='PACKING') puede atender tanto el
  // packing como la oficina administrativa: a diferencia de las demás zonas
  // fijas, acá no se bloquea del todo, se deja elegir entre esas dos (ver
  // también AtencionForm, que ya no fuerza zona_asignada en el submit para
  // este caso).
  const esPackingFijo = zonaUsuario === 'PACKING'
  const zonaBloqueada = Boolean(zonaUsuario) && !esPackingFijo
  const opcionesZona = esPackingFijo ? (['PACKING', 'OFICINA'] as const) : ZONAS

  const buscarPorLegajo = useCallback(
    async (valorLegajo: string) => {
      const legajoLimpio = valorLegajo.trim()
      if (legajoLimpio !== valorLegajo) setValue('legajo', legajoLimpio)
      if (!LEGAJO_REGEX.test(legajoLimpio)) {
        setBusqueda('formato_invalido')
        setEsAfiliado(null)
        setAntecedentes(null)
        void trigger('legajo')
        return
      }
      setBusqueda('buscando')
      // Los antecedentes (faltas previas del legajo) se traen junto con el
      // resto: ya no es un paso aparte al cerrar el caso (CerrarCasoModal),
      // se muestran acá para elegir la acción correctiva con ese contexto.
      const [esAfiliadoEncontrado, trabajador, antecedentesEncontrados] = await Promise.all([
        buscarAfiliadoPorLegajo(legajoLimpio),
        buscarTrabajadorPorLegajo(legajoLimpio, fecha ?? ''),
        buscarAntecedentesPorLegajo(legajoLimpio),
      ])
      setEsAfiliado(esAfiliadoEncontrado)
      setAntecedentes(antecedentesEncontrados)
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

  // Derivar a un registro desde Herramientas > Búsqueda (ver
  // AccionesPersonaModal): llega como /?legajo=XXXX, precarga el legajo y
  // busca automáticamente, igual que si el usuario lo hubiera tipeado.
  useEffect(() => {
    const legajoParam = searchParams.get('legajo')
    if (!legajoParam) return
    setValue('legajo', legajoParam)
    void buscarPorLegajo(legajoParam)
    setSearchParams(
      (prev) => {
        prev.delete('legajo')
        return prev
      },
      { replace: true },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
                placeholder="1012345678"
                {...register('legajo', {
                  onChange: () => {
                    setBusqueda('idle')
                    setEsAfiliado(null)
                    setAntecedentes(null)
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
          <input type="text" placeholder="JUAN PÉREZ LÓPEZ" {...conMayusculas(register('nombreInvolucrado'))} className="input" />
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
              esPackingFijo
                ? 'Personal de Packing: elige si este caso es de Packing u Oficina.'
                : zonaUsuario
                  ? 'Fijada por Personal por zona: todo lo que registras queda siempre en esta zona.'
                  : supRrll
                    ? `Sup. RRLL: ${supRrll}`
                    : undefined
            }
          >
            <select {...register('zona')} disabled={zonaBloqueada} className={cn('input', zonaBloqueada && 'bg-neutral-100 text-neutral-500 cursor-not-allowed')}>
              <option value="">Selecciona...</option>
              {opcionesZona.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fundo" value={fundo} hint={modulo ? `Módulo detectado: ${modulo}` : undefined}>
            <input type="text" placeholder="REM 2-W" {...conMayusculas(register('fundo'))} className="input" />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Grupo / cuadrilla" value={valores.grupo}>
            <input type="text" placeholder="CH12" {...conMayusculas(register('grupo'))} className="input" />
          </Field>
          <Field label="Área" value={valores.area}>
            <input type="text" placeholder="COSECHA" {...conMayusculas(register('area'))} className="input" />
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

      <CardSection title="Seguimiento" icon={<StickyNote className="size-4 text-brand" />}>
        <Field label="Reporta" value={valores.reporte} error={errors.reporte?.message}>
          <input type="text" {...conMayusculas(register('reporte'))} className="input" />
        </Field>
        <Field label="Comentarios" value={valores.comentarios} error={errors.comentarios?.message}>
          <textarea rows={3} placeholder="Detalle narrativo del caso..." {...conMayusculas(register('comentarios'))} className="input" />
        </Field>
      </CardSection>

      <CardSection title="Cierre del caso" icon={<CheckCircle2 className="size-4 text-brand" />}>
        {/* El cierre ya no es un paso aparte (antes "Cerrar caso" después de
            registrar, ver CerrarCasoModal.tsx): se completa acá mismo y el
            caso se guarda directamente como CERRADO (ver AtencionForm.tsx). */}
        {antecedentes !== null && (
          <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
            <p className="text-sm font-medium text-neutral-800 flex items-center gap-1.5 mb-1">
              <History className="size-4 text-brand" />
              ANTECEDENTES
            </p>
            {antecedentes.length === 0 ? (
              <p className="text-sm text-neutral-500">Sin faltas previas registradas para este legajo.</p>
            ) : (
              <>
                <p className="text-sm text-neutral-700 mb-2">
                  {antecedentes.length} falta{antecedentes.length > 1 ? 's' : ''} previa{antecedentes.length > 1 ? 's' : ''} registrada
                  {antecedentes.length > 1 ? 's' : ''} para este legajo:
                </p>
                <ul className="space-y-1 max-h-40 overflow-y-auto">
                  {antecedentes.map((a, i) => (
                    <li key={i} className="text-sm text-neutral-600 flex items-center gap-2">
                      <span className="text-neutral-400">{a.fecha}</span>
                      <span className="flex-1">{a.subcategoria}</span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
                          a.estado === 'CERRADO' ? 'bg-success-soft text-emerald-800' : 'bg-warning-soft text-amber-800',
                        )}
                      >
                        {a.estado === 'CERRADO' ? a.accion_correctiva : 'PENDIENTE'}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        <Field label="Acción correctiva" value={accionCorrectiva} error={errors.accionCorrectiva?.message}>
          <select {...register('accionCorrectiva')} className="input">
            <option value="">Selecciona...</option>
            {ACCIONES_CORRECTIVAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </Field>

        {requiereDias(accionCorrectiva || '') && (
          <Field label="Días de suspensión" value={valores.diasSuspension} error={errors.diasSuspension?.message}>
            <input type="number" min={1} {...register('diasSuspension', { valueAsNumber: true })} className="input" />
          </Field>
        )}

        {requiereCompromiso(accionCorrectiva || '') && (
          <>
            <Field label="Detalle compromiso" value={valores.detalleCompromiso} error={errors.detalleCompromiso?.message}>
              <textarea rows={2} {...conMayusculas(register('detalleCompromiso'))} className="input" />
            </Field>
            <Field label="Fecha de compromiso" value={valores.fechaCompromiso} error={errors.fechaCompromiso?.message}>
              <input type="date" {...register('fechaCompromiso')} className="input" />
            </Field>
          </>
        )}

        <Field label="Detalle del cierre (opcional)" value={valores.detalleCierre}>
          <input type="text" {...conMayusculas(register('detalleCierre'))} className="input" />
        </Field>
      </CardSection>

      {escaneando && <BarcodeScannerModal onDetected={onCodigoEscaneado} onClose={() => setEscaneando(false)} />}
    </>
  )
}
