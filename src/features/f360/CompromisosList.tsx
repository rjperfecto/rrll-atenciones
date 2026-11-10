import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  Inbox,
  Loader2,
  Pencil,
  RefreshCw,
  Search,
  SearchX,
  Trash2,
  X,
} from 'lucide-react'
import { listarAtencionesParaExportar, eliminarAtencion, type FiltrosAtenciones } from '@/lib/atencionesApi'
import { exportar360LaboralXlsx, exportarDetalleAlertas360Xlsx } from '@/lib/exportXlsx'
import { useAuth } from '@/features/auth/AuthContext'
import { VerificarCompromisosModal } from './VerificarCompromisosModal'
import { DetalleAtencionModal } from '@/features/atenciones/DetalleAtencionModal'
import { EditarAtencionModal } from '@/features/atenciones/EditarAtencionModal'
import { ZONAS } from '@/data/zonasFundos'
import { SIN_COMPROMISO, type EstadoVerificacionCompromiso } from '@/data/formulario360'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { EstadoBadge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import { estadoDeCampo, CLASE_INPUT_POR_ESTADO } from '@/lib/campoEstado'
import type { Atencion, Estado } from '@/types'

const PAGE_SIZE = 10
const ESTADOS: Estado[] = ['ABIERTO', 'CERRADO']
const TIPOS_BASE = ['360 LABORAL']

// Un compromiso de 360 Laboral es una cadena de visitas al mismo grupo: la
// caminata original (raiz) y cada ronda de verificación posterior (ver
// migración 0043), ordenadas en el tiempo. "estadoActual" es el de la
// última ronda (no el de la raíz, que siempre queda CERRADO apenas se
// verifica — ver VerificarCompromisosModal), es el que importa para saber
// si el compromiso sigue pendiente.
interface CadenaCompromiso {
  raizId: string
  pasos: Atencion[]
  ultimoPaso: Atencion
  estadoActual: Estado
}

function agruparEnCadenas(atenciones: Atencion[]): CadenaCompromiso[] {
  const mapa = new Map<string, Atencion[]>()
  for (const a of atenciones) {
    const raizId = a.caminata_origen_id ?? a.id
    const lista = mapa.get(raizId) ?? []
    lista.push(a)
    mapa.set(raizId, lista)
  }
  const cadenas: CadenaCompromiso[] = []
  for (const [raizId, pasos] of mapa) {
    pasos.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.created_at.localeCompare(b.created_at))
    const ultimoPaso = pasos[pasos.length - 1]
    cadenas.push({ raizId, pasos, ultimoPaso, estadoActual: ultimoPaso.estado })
  }
  // Más reciente actividad primero, mismo orden que el historial plano de antes.
  cadenas.sort((a, b) => b.ultimoPaso.fecha.localeCompare(a.ultimoPaso.fecha))
  return cadenas
}

function resumenPaso(a: Atencion): string {
  if (!a.caminata_origen_id) {
    const compromisos = a.alertas_reportadas.filter((al) => al.accion && al.accion !== SIN_COMPROMISO).length
    return `${a.alertas_reportadas.length} alerta${a.alertas_reportadas.length === 1 ? '' : 's'}, ${compromisos} compromiso${compromisos === 1 ? '' : 's'} del líder`
  }
  const estados = a.alertas_reportadas
    .flatMap((al) => [al.verificacion_lider, al.verificacion_rrll])
    .filter((e): e is EstadoVerificacionCompromiso => Boolean(e))
  const cumplidos = estados.filter((e) => e === 'CUMPLIDO').length
  const pendientes = estados.length - cumplidos
  let texto = `${cumplidos} cumplido${cumplidos === 1 ? '' : 's'}`
  if (pendientes > 0) texto += `, ${pendientes} pendiente${pendientes === 1 ? '' : 's'}`
  if (a.fecha_fin_compromiso) texto += ` — próxima verificación: ${a.fecha_fin_compromiso}`
  return texto
}

export function CompromisosList() {
  const { profile } = useAuth()
  const [searchParams] = useSearchParams()
  const [verificando, setVerificando] = useState<Atencion | null>(null)
  const [viendoDetalle, setViendoDetalle] = useState<Atencion | null>(null)
  const [editando, setEditando] = useState<Atencion | null>(null)
  const [busqueda, setBusqueda] = useState(() => searchParams.get('q') ?? '')
  const [busquedaDebounced, setBusquedaDebounced] = useState(() => searchParams.get('q') ?? '')
  const [filtroEstado, setFiltroEstado] = useState(() => searchParams.get('estado') ?? '')
  const [filtroZona, setFiltroZona] = useState('')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')
  const [pagina, setPagina] = useState(1)
  const [cadenas, setCadenas] = useState<CadenaCompromiso[] | null>(null)
  const [cargando, setCargando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [exportandoDetalle, setExportandoDetalle] = useState(false)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)

  // Ver todo lo de tu zona depende de tener zona_asignada, sin importar el
  // rol (ver migración 0021) — un CAMPO con zona ve todo lo de esa zona, no
  // solo lo propio. Eliminar sigue siendo solo ADMIN/SUPERVISOR.
  const puedeVerTodo = profile?.rol === 'ADMIN' || profile?.rol === 'SUPERVISOR' || Boolean(profile?.zona_asignada)
  // Editar y eliminar comparten el mismo alcance.
  const puedeGestionar = profile?.rol === 'ADMIN' || profile?.rol === 'SUPERVISOR'

  useEffect(() => {
    const t = setTimeout(() => setBusquedaDebounced(busqueda), 400)
    return () => clearTimeout(t)
  }, [busqueda])

  const rangoFechaInvalido = Boolean(filtroDesde && filtroHasta && filtroDesde > filtroHasta)
  const mensajeRango = rangoFechaInvalido ? '"Desde" no puede ser posterior a "Hasta"' : undefined

  // El filtro de Estado no se manda al servidor: se aplica después de armar
  // las cadenas, contra el estado de la ÚLTIMA ronda (la raíz casi siempre
  // queda CERRADA apenas se verifica una vez, ver VerificarCompromisosModal).
  const filtros: FiltrosAtenciones = {
    busqueda: busquedaDebounced || undefined,
    zona: filtroZona || undefined,
    desde: filtroDesde || undefined,
    hasta: filtroHasta || undefined,
  }
  const filtrosClave = JSON.stringify(filtros)

  // Compromisos se arma como línea de tiempo por grupo (caminata original +
  // sus rondas de verificación, ver agruparEnCadenas): a diferencia del
  // Historial de Atenciones, acá no alcanza con paginar filas sueltas en el
  // servidor porque una ronda y su caminata original tienen que verse
  // juntas. 360 Laboral es un subconjunto acotado de la tabla, así que se
  // trae todo lo que matchea los filtros de una vez y se pagina por cadena
  // (no por fila) en el navegador.
  const cargar = useCallback(async () => {
    if (!profile || rangoFechaInvalido) return
    setCargando(true)
    const { data, error } = await listarAtencionesParaExportar(profile.id, puedeVerTodo, JSON.parse(filtrosClave), TIPOS_BASE)
    if (error) {
      setErrorCarga(error)
      setCargando(false)
      return
    }
    setErrorCarga(null)
    setCadenas(agruparEnCadenas(data))
    setCargando(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, puedeVerTodo, rangoFechaInvalido, filtrosClave])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const cadenasFiltradas = (cadenas ?? []).filter((c) => !filtroEstado || c.estadoActual === filtroEstado)
  const total = cadenasFiltradas.length
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const cadenasPagina = cadenasFiltradas.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE)
  const hayFiltrosActivos = Boolean(busqueda || filtroEstado || filtroZona || filtroDesde || filtroHasta)
  const estadoBusqueda = estadoDeCampo(busqueda)
  const estadoFiltroEstado = estadoDeCampo(filtroEstado)
  const estadoFiltroZona = estadoDeCampo(filtroZona)
  const estadoDesde = estadoDeCampo(filtroDesde, mensajeRango)
  const estadoHasta = estadoDeCampo(filtroHasta, mensajeRango)

  function limpiarFiltros() {
    setBusqueda('')
    setBusquedaDebounced('')
    setFiltroEstado('')
    setFiltroZona('')
    setFiltroDesde('')
    setFiltroHasta('')
    setPagina(1)
  }

  function actualizarFiltro(setter: (v: string) => void) {
    return (v: string) => {
      setter(v)
      setPagina(1)
    }
  }

  async function eliminar(a: Atencion) {
    const confirmado = window.confirm(`¿Eliminar esta caminata 360 (${a.fecha})? Esta acción no se puede deshacer.`)
    if (!confirmado) return
    setEliminandoId(a.id)
    const { error } = await eliminarAtencion(a.id)
    setEliminandoId(null)
    if (error) {
      window.alert(`No se pudo eliminar: ${error}`)
      return
    }
    void cargar()
  }

  // A diferencia de la vista agrupada (que filtra Estado por la última
  // ronda), el Excel exporta filas sueltas: acá Estado sí se manda tal cual
  // al servidor, filtra por el estado propio de cada fila.
  async function exportar() {
    if (!profile) return
    setExportando(true)
    const { data, error } = await listarAtencionesParaExportar(profile.id, puedeVerTodo, { ...filtros, estado: filtroEstado || undefined }, TIPOS_BASE)
    if (!error) exportar360LaboralXlsx(data)
    setExportando(false)
  }

  async function exportarDetalle() {
    if (!profile) return
    setExportandoDetalle(true)
    const { data, error } = await listarAtencionesParaExportar(profile.id, puedeVerTodo, { ...filtros, estado: filtroEstado || undefined }, TIPOS_BASE)
    if (!error) exportarDetalleAlertas360Xlsx(data)
    setExportandoDetalle(false)
  }

  if (errorCarga) {
    return (
      <Card className="p-10 flex flex-col items-center text-center gap-2">
        <AlertCircle className="size-10 text-red-300" />
        <p className="text-sm font-medium text-neutral-700">No se pudo cargar Compromisos</p>
        <p className="text-sm text-neutral-500">{errorCarga}</p>
        <Button variant="secondary" onClick={cargar}>
          <RefreshCw className="size-4" />
          Reintentar
        </Button>
      </Card>
    )
  }

  if (!cadenas) return <p className="text-sm text-neutral-500">Cargando...</p>

  return (
    <div>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <PageHeader title="Compromisos" description={`${total} grupo${total === 1 ? '' : 's'} en seguimiento de 360 Laboral`} />
        {cadenas.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" onClick={exportar} loading={exportando}>
              <Download className="size-4" />
              {exportando ? 'Exportando...' : 'Exportar a Excel'}
            </Button>
            <Button variant="secondary" onClick={exportarDetalle} loading={exportandoDetalle}>
              <Download className="size-4" />
              {exportandoDetalle ? 'Exportando...' : 'Exportar detalle de alertas'}
            </Button>
          </div>
        )}
      </div>

      {cadenas.length === 0 && !hayFiltrosActivos ? (
        <Card className="p-10 flex flex-col items-center text-center gap-2">
          <Inbox className="size-10 text-neutral-300" />
          <p className="text-sm font-medium text-neutral-700">Todavía no hay caminatas registradas</p>
          <p className="text-sm text-neutral-500">Las que registres en "Registrar caminata" van a aparecer aquí.</p>
        </Card>
      ) : (
        <>
          <Card className="p-4 mb-4 space-y-3">
            <div className="relative">
              {estadoBusqueda === 'success' ? (
                <CheckCircle2 className="size-4 text-success absolute left-3 top-1/2 -translate-y-1/2" />
              ) : (
                <Search className="size-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              )}
              <input
                type="text"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value)
                  setPagina(1)
                }}
                placeholder="Buscar por líder de cosecha, fundo o grupo..."
                className={cn('input pl-9', CLASE_INPUT_POR_ESTADO[estadoBusqueda])}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <select
                value={filtroZona}
                onChange={(e) => actualizarFiltro(setFiltroZona)(e.target.value)}
                className={cn('input', CLASE_INPUT_POR_ESTADO[estadoFiltroZona])}
              >
                <option value="">Toda zona</option>
                {ZONAS.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
              <select
                value={filtroEstado}
                onChange={(e) => actualizarFiltro(setFiltroEstado)(e.target.value)}
                className={cn('input', CLASE_INPUT_POR_ESTADO[estadoFiltroEstado])}
              >
                <option value="">Todos los estados</option>
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={filtroDesde}
                onChange={(e) => actualizarFiltro(setFiltroDesde)(e.target.value)}
                className={cn('input', CLASE_INPUT_POR_ESTADO[estadoDesde])}
                aria-label="Desde"
                title="Desde"
              />
              <input
                type="date"
                value={filtroHasta}
                onChange={(e) => actualizarFiltro(setFiltroHasta)(e.target.value)}
                className={cn('input', CLASE_INPUT_POR_ESTADO[estadoHasta])}
                aria-label="Hasta"
                title="Hasta"
              />
            </div>
            {rangoFechaInvalido && (
              <p className="text-xs text-danger flex items-center gap-1">
                <AlertCircle className="size-3.5 shrink-0" />
                {mensajeRango}
              </p>
            )}
            {hayFiltrosActivos && (
              <button onClick={limpiarFiltros} className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800">
                <X className="size-3.5" />
                Limpiar filtros
              </button>
            )}
          </Card>

          {cargando ? (
            <Card className="p-10 flex items-center justify-center">
              <Loader2 className="size-6 text-brand animate-spin" />
            </Card>
          ) : total === 0 ? (
            <Card className="p-10 flex flex-col items-center text-center gap-2">
              <SearchX className="size-10 text-neutral-300" />
              <p className="text-sm font-medium text-neutral-700">Ningún compromiso coincide con los filtros</p>
              <button onClick={limpiarFiltros} className="text-sm text-brand hover:underline">
                Limpiar filtros
              </button>
            </Card>
          ) : (
            <div className="space-y-4">
              {cadenasPagina.map((cadena) => {
                const raiz = cadena.pasos[0]
                const esFinal = (paso: Atencion) => paso.id === cadena.ultimoPaso.id
                return (
                  <div key={cadena.raizId} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-sm font-semibold text-neutral-900">
                        {raiz.zona === 'PACKING' ? `Packing: ${raiz.fundo ?? ''}` : raiz.lider_cosecha || raiz.fundo || raiz.grupo}
                      </span>
                      <span className="text-xs text-neutral-500">{raiz.zona}</span>
                      {raiz.grupo && <span className="text-xs text-neutral-500">· Grupo {raiz.grupo}</span>}
                      <span className="ml-auto">
                        <EstadoBadge estado={cadena.estadoActual} />
                      </span>
                    </div>

                    <ul>
                      {cadena.pasos.map((paso, i) => {
                        const pendiente = paso.compromiso_generado && paso.estado !== 'CERRADO'
                        return (
                          <li key={paso.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <span className={cn('size-2.5 rounded-full shrink-0 mt-1.5', esFinal(paso) ? 'bg-brand' : 'bg-neutral-300')} />
                              {i < cadena.pasos.length - 1 && <span className="w-px flex-1 bg-neutral-200" />}
                            </div>
                            <div className="flex-1 pb-4 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium text-neutral-900">{paso.fecha}</span>
                                <span className="text-xs text-neutral-500">{paso.caminata_origen_id ? 'Verificación de compromisos' : 'Caminata 360'}</span>
                                <EstadoBadge estado={paso.estado} />
                              </div>
                              <p className="text-xs text-neutral-500 mt-0.5">{resumenPaso(paso)}</p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Button variant="secondary" onClick={() => setViendoDetalle(paso)}>
                                  <Eye className="size-4" />
                                  Ver detalles
                                </Button>
                                {pendiente && (
                                  <Button onClick={() => setVerificando(paso)}>
                                    <Clock className="size-4" />
                                    Verificar compromisos
                                  </Button>
                                )}
                                {puedeGestionar && (
                                  <>
                                    <Button variant="secondary" onClick={() => setEditando(paso)} className="p-2.5" aria-label="Editar">
                                      <Pencil className="size-4" />
                                    </Button>
                                    <Button
                                      variant="danger"
                                      onClick={() => eliminar(paso)}
                                      loading={eliminandoId === paso.id}
                                      className="p-2.5"
                                      aria-label="Eliminar"
                                    >
                                      <Trash2 className="size-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })}

              {totalPaginas > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <Button variant="secondary" onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina === 1}>
                    <ChevronLeft className="size-4" />
                    Anterior
                  </Button>
                  <span className="text-sm text-neutral-500">
                    Página {pagina} de {totalPaginas}
                  </span>
                  <Button variant="secondary" onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}>
                    Siguiente
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {verificando && (
        <VerificarCompromisosModal
          atencion={verificando}
          onClose={() => {
            setVerificando(null)
            void cargar()
          }}
        />
      )}
      {viendoDetalle && <DetalleAtencionModal atencion={viendoDetalle} onClose={() => setViendoDetalle(null)} />}
      {editando && (
        <EditarAtencionModal
          atencion={editando}
          onClose={() => {
            setEditando(null)
            void cargar()
          }}
        />
      )}
    </div>
  )
}
