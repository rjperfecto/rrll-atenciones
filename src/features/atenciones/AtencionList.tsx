import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Inbox,
  Search,
  SearchX,
  X,
} from 'lucide-react'
import { db } from '@/lib/db'
import { exportarAtencionesCsv } from '@/lib/exportCsv'
import { useAuth } from '@/features/auth/AuthContext'
import { CerrarCasoModal } from './CerrarCasoModal'
import { DetalleAtencionModal } from './DetalleAtencionModal'
import { ZONAS } from '@/data/zonasFundos'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { GravedadBadge, EstadoBadge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import { estadoDeCampo, CLASE_INPUT_POR_ESTADO } from '@/lib/campoEstado'
import type { Atencion, Estado } from '@/types'
import type { Gravedad } from '@/data/categorizacion'

const PAGE_SIZE = 10

const ESTADOS: Estado[] = ['ABIERTO', 'EN_PROCESO', 'CERRADO']
const GRAVEDADES: Gravedad[] = ['BAJO', 'MEDIO', 'ALTO']

function coincideBusqueda(a: Atencion, texto: string) {
  if (!texto) return true
  const q = texto.trim().toLowerCase()
  const involucrado = a.involucrados[0]
  return [
    involucrado?.nombre_completo,
    involucrado?.dni,
    involucrado?.legajo,
    a.fundo,
    a.grupo,
    a.subcategoria,
  ].some((campo) => campo?.toLowerCase().includes(q))
}

export function AtencionList() {
  const { profile } = useAuth()
  const [cerrando, setCerrando] = useState<Atencion | null>(null)
  const [viendoDetalle, setViendoDetalle] = useState<Atencion | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroGravedad, setFiltroGravedad] = useState('')
  const [filtroZona, setFiltroZona] = useState('')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')
  const [pagina, setPagina] = useState(1)

  const atenciones = useLiveQuery(async () => {
    const all = await db.atenciones.orderBy('fecha').reverse().toArray()
    if (!profile) return []
    return profile.rol === 'ADMIN' ? all : all.filter((a) => a.responsable_id === profile.id)
  }, [profile])

  const filtradas = useMemo(() => {
    if (!atenciones) return []
    return atenciones.filter((a) => {
      if (filtroEstado && a.estado !== filtroEstado) return false
      if (filtroGravedad && a.gravedad !== filtroGravedad) return false
      if (filtroZona && a.zona !== filtroZona) return false
      if (filtroDesde && a.fecha < filtroDesde) return false
      if (filtroHasta && a.fecha > filtroHasta) return false
      if (!coincideBusqueda(a, busqueda)) return false
      return true
    })
  }, [atenciones, filtroEstado, filtroGravedad, filtroZona, filtroDesde, filtroHasta, busqueda])

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE))
  const paginaActual = Math.min(pagina, totalPaginas)
  const visibles = filtradas.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE)

  const hayFiltrosActivos = Boolean(
    busqueda || filtroEstado || filtroGravedad || filtroZona || filtroDesde || filtroHasta,
  )
  const rangoFechaInvalido = Boolean(filtroDesde && filtroHasta && filtroDesde > filtroHasta)
  const mensajeRango = rangoFechaInvalido ? '"Desde" no puede ser posterior a "Hasta"' : undefined
  const estadoBusqueda = estadoDeCampo(busqueda)
  const estadoFiltroEstado = estadoDeCampo(filtroEstado)
  const estadoFiltroGravedad = estadoDeCampo(filtroGravedad)
  const estadoFiltroZona = estadoDeCampo(filtroZona)
  const estadoDesde = estadoDeCampo(filtroDesde, mensajeRango)
  const estadoHasta = estadoDeCampo(filtroHasta, mensajeRango)

  function limpiarFiltros() {
    setBusqueda('')
    setFiltroEstado('')
    setFiltroGravedad('')
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

  if (!atenciones) return <p className="text-sm text-neutral-500">Cargando...</p>

  return (
    <div>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <PageHeader title="Historial" description={`${filtradas.length} de ${atenciones.length} atenciones`} />
        {atenciones.length > 0 && (
          <Button variant="secondary" onClick={() => exportarAtencionesCsv(filtradas)}>
            <Download className="size-4" />
            Exportar a Excel (CSV)
          </Button>
        )}
      </div>

      {atenciones.length === 0 ? (
        <Card className="p-10 flex flex-col items-center text-center gap-2">
          <Inbox className="size-10 text-neutral-300" />
          <p className="text-sm font-medium text-neutral-700">Todavía no hay atenciones registradas</p>
          <p className="text-sm text-neutral-500">Los casos que registres en "Nueva atención" van a aparecer aquí.</p>
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
                onChange={(e) => actualizarFiltro(setBusqueda)(e.target.value)}
                placeholder="Buscar por nombre, legajo, DNI, fundo o grupo..."
                className={cn('input pl-9', CLASE_INPUT_POR_ESTADO[estadoBusqueda])}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <select
                value={filtroEstado}
                onChange={(e) => actualizarFiltro(setFiltroEstado)(e.target.value)}
                className={cn('input', CLASE_INPUT_POR_ESTADO[estadoFiltroEstado])}
              >
                <option value="">Todos los estados</option>
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {e.replace('_', ' ')}
                  </option>
                ))}
              </select>
              <select
                value={filtroGravedad}
                onChange={(e) => actualizarFiltro(setFiltroGravedad)(e.target.value)}
                className={cn('input', CLASE_INPUT_POR_ESTADO[estadoFiltroGravedad])}
              >
                <option value="">Toda gravedad</option>
                {GRAVEDADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
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
              <button
                onClick={limpiarFiltros}
                className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800"
              >
                <X className="size-3.5" />
                Limpiar filtros
              </button>
            )}
          </Card>

          {filtradas.length === 0 ? (
            <Card className="p-10 flex flex-col items-center text-center gap-2">
              <SearchX className="size-10 text-neutral-300" />
              <p className="text-sm font-medium text-neutral-700">Ningún caso coincide con los filtros</p>
              <button onClick={limpiarFiltros} className="text-sm text-brand hover:underline">
                Limpiar filtros
              </button>
            </Card>
          ) : (
            <div className="space-y-3">
              {visibles.map((a) => (
                <div key={a.id} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-neutral-900">{a.fecha}</span>
                    <span className="text-xs text-neutral-500">{a.zona}</span>
                    {a.fundo && <span className="text-xs text-neutral-500">· {a.fundo}</span>}
                    <span className="ml-auto flex items-center gap-2">
                      <GravedadBadge gravedad={a.gravedad} />
                      <EstadoBadge estado={a.estado} />
                    </span>
                    {!a.synced && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pendiente de sincronizar
                      </span>
                    )}
                  </div>
                  {a.falta && <p className="text-sm text-neutral-600">Falta: {a.falta}</p>}
                  <p className="text-sm font-medium text-neutral-900 mt-1">{a.involucrados[0]?.nombre_completo}</p>

                  <div className="flex items-center gap-2 mt-3">
                    <Button variant="secondary" onClick={() => setViendoDetalle(a)}>
                      <Eye className="size-4" />
                      Ver detalles
                    </Button>
                    {a.estado !== 'CERRADO' && (
                      <Button onClick={() => setCerrando(a)}>
                        <CheckCircle2 className="size-4" />
                        Cerrar caso
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {totalPaginas > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    disabled={paginaActual === 1}
                  >
                    <ChevronLeft className="size-4" />
                    Anterior
                  </Button>
                  <span className="text-sm text-neutral-500">
                    Página {paginaActual} de {totalPaginas}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                    disabled={paginaActual === totalPaginas}
                  >
                    Siguiente
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {cerrando && <CerrarCasoModal atencion={cerrando} onClose={() => setCerrando(null)} />}
      {viendoDetalle && <DetalleAtencionModal atencion={viendoDetalle} onClose={() => setViendoDetalle(null)} />}
    </div>
  )
}
