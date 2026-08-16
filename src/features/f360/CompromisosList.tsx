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
  RefreshCw,
  Search,
  SearchX,
  Trash2,
  X,
} from 'lucide-react'
import { listarAtencionesPaginado, listarAtencionesParaExportar, eliminarAtencion, type FiltrosAtenciones } from '@/lib/atencionesApi'
import { exportar360LaboralCsv } from '@/lib/exportCsv'
import { useAuth } from '@/features/auth/AuthContext'
import { CerrarCompromisoModal } from './CerrarCompromisoModal'
import { DetalleAtencionModal } from '@/features/atenciones/DetalleAtencionModal'
import { ZONAS } from '@/data/zonasFundos'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { GravedadBadge, EstadoBadge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import { estadoDeCampo, CLASE_INPUT_POR_ESTADO } from '@/lib/campoEstado'
import type { Atencion, Estado } from '@/types'

const PAGE_SIZE = 10
const ESTADOS: Estado[] = ['ABIERTO', 'CERRADO']
const TIPOS_BASE = ['360 LABORAL']

export function CompromisosList() {
  const { profile } = useAuth()
  const [searchParams] = useSearchParams()
  const [cerrando, setCerrando] = useState<Atencion | null>(null)
  const [viendoDetalle, setViendoDetalle] = useState<Atencion | null>(null)
  const [busqueda, setBusqueda] = useState(() => searchParams.get('q') ?? '')
  const [busquedaDebounced, setBusquedaDebounced] = useState(() => searchParams.get('q') ?? '')
  const [filtroEstado, setFiltroEstado] = useState(() => searchParams.get('estado') ?? '')
  const [filtroZona, setFiltroZona] = useState('')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')
  const [pagina, setPagina] = useState(1)
  const [atenciones, setAtenciones] = useState<Atencion[] | null>(null)
  const [total, setTotal] = useState(0)
  const [cargando, setCargando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)

  // Ver todo lo de tu zona depende de tener zona_asignada, sin importar el
  // rol (ver migración 0021) — un CAMPO con zona ve todo lo de esa zona, no
  // solo lo propio. Eliminar sigue siendo solo ADMIN/SUPERVISOR.
  const puedeVerTodo = profile?.rol === 'ADMIN' || profile?.rol === 'SUPERVISOR' || Boolean(profile?.zona_asignada)
  const puedeEliminar = profile?.rol === 'ADMIN' || profile?.rol === 'SUPERVISOR'

  useEffect(() => {
    const t = setTimeout(() => setBusquedaDebounced(busqueda), 400)
    return () => clearTimeout(t)
  }, [busqueda])

  const rangoFechaInvalido = Boolean(filtroDesde && filtroHasta && filtroDesde > filtroHasta)
  const mensajeRango = rangoFechaInvalido ? '"Desde" no puede ser posterior a "Hasta"' : undefined

  const filtros: FiltrosAtenciones = {
    busqueda: busquedaDebounced || undefined,
    estado: filtroEstado || undefined,
    zona: filtroZona || undefined,
    desde: filtroDesde || undefined,
    hasta: filtroHasta || undefined,
  }
  const filtrosClave = JSON.stringify(filtros)

  const cargar = useCallback(async () => {
    if (!profile || rangoFechaInvalido) return
    setCargando(true)
    const { data, total: totalNuevo, error } = await listarAtencionesPaginado(
      profile.id,
      puedeVerTodo,
      JSON.parse(filtrosClave),
      pagina,
      PAGE_SIZE,
      TIPOS_BASE,
    )
    setAtenciones(data)
    setTotal(totalNuevo)
    setErrorCarga(error)
    setCargando(false)
    if (data.length === 0 && totalNuevo > 0 && pagina > 1) setPagina(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, rangoFechaInvalido, filtrosClave, pagina])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE))
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

  async function exportar() {
    if (!profile) return
    setExportando(true)
    const { data, error } = await listarAtencionesParaExportar(profile.id, puedeVerTodo, filtros, TIPOS_BASE)
    if (!error) exportar360LaboralCsv(data)
    setExportando(false)
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

  if (!atenciones) return <p className="text-sm text-neutral-500">Cargando...</p>

  return (
    <div>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <PageHeader title="Compromisos" description={`${total} caminata${total === 1 ? '' : 's'} de 360 Laboral`} />
        {total > 0 && (
          <Button variant="secondary" onClick={exportar} loading={exportando}>
            <Download className="size-4" />
            {exportando ? 'Exportando...' : 'Exportar a Excel (CSV)'}
          </Button>
        )}
      </div>

      {total === 0 && !hayFiltrosActivos ? (
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
              <p className="text-sm font-medium text-neutral-700">Ninguna caminata coincide con los filtros</p>
              <button onClick={limpiarFiltros} className="text-sm text-brand hover:underline">
                Limpiar filtros
              </button>
            </Card>
          ) : (
            <div className="space-y-3">
              {atenciones.map((a) => {
                const compromisoPendiente = a.compromiso_generado && a.estado !== 'CERRADO'
                return (
                  <div key={a.id} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-neutral-900">{a.fecha}</span>
                      <span className="text-xs text-neutral-500">{a.zona}</span>
                      {a.fundo && <span className="text-xs text-neutral-500">· {a.fundo}</span>}
                      <span className="ml-auto flex items-center gap-2">
                        <GravedadBadge gravedad={a.gravedad} />
                        <EstadoBadge estado={a.estado} />
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600">
                      {a.zona === 'PACKING' ? `Packing: ${a.fundo ?? ''} · Turno ${a.modulo ?? ''}` : `Líder de cosecha: ${a.lider_cosecha ?? ''}`}
                    </p>
                    <p className="text-sm font-medium text-neutral-900 mt-1">{a.area}</p>

                    <div className="flex items-center gap-2 mt-3">
                      <Button variant="secondary" onClick={() => setViendoDetalle(a)}>
                        <Eye className="size-4" />
                        Ver detalles
                      </Button>
                      {compromisoPendiente && (
                        <Button onClick={() => setCerrando(a)}>
                          <Clock className="size-4" />
                          Cerrar compromiso
                        </Button>
                      )}
                      {puedeEliminar && (
                        <Button variant="danger" onClick={() => eliminar(a)} loading={eliminandoId === a.id} className="ml-auto">
                          <Trash2 className="size-4" />
                          Eliminar
                        </Button>
                      )}
                    </div>
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

      {cerrando && (
        <CerrarCompromisoModal
          atencion={cerrando}
          onClose={() => {
            setCerrando(null)
            void cargar()
          }}
        />
      )}
      {viendoDetalle && <DetalleAtencionModal atencion={viendoDetalle} onClose={() => setViendoDetalle(null)} />}
    </div>
  )
}
