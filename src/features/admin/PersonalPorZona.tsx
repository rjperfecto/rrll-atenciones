import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, MapPinned, Search, Trash2, Users } from 'lucide-react'
import { LEGAJO_REGEX } from '@/data/legajo'
import { ZONAS, type Zona } from '@/data/zonasFundos'
import { buscarTrabajadorPorLegajo } from '@/lib/trabajadoresApi'
import {
  asignarPersonalZona,
  listarPersonalZona,
  quitarPersonalZona,
  type PersonalZona,
} from '@/lib/personalZonaApi'
import { PageHeader } from '@/components/ui/PageHeader'
import { CardSection } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

type EstadoBusqueda = 'idle' | 'buscando' | 'encontrado' | 'no_encontrado' | 'formato_invalido'

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

// Administración > Personal por zona: fija la Zona de un legajo sin importar
// dónde aparezca trabajando ese día en TAREO (ver src/lib/personalZonaApi.ts
// y su uso en FormularioGeneral/AtencionForm/RegistrarCaminata, que fuerzan
// la Zona del caso a esta asignación cuando existe).
export function PersonalPorZona() {
  const [lista, setLista] = useState<PersonalZona[] | null>(null)
  const [filtroZona, setFiltroZona] = useState<Zona | ''>('')

  const [legajo, setLegajo] = useState('')
  const [nombre, setNombre] = useState('')
  const [zona, setZona] = useState<Zona | ''>('')
  const [busqueda, setBusqueda] = useState<EstadoBusqueda>('idle')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  async function cargarLista() {
    setLista(await listarPersonalZona())
  }

  useEffect(() => {
    void cargarLista()
  }, [])

  async function buscarLegajo() {
    const legajoLimpio = legajo.trim()
    if (legajoLimpio !== legajo) setLegajo(legajoLimpio)
    if (!LEGAJO_REGEX.test(legajoLimpio)) {
      setBusqueda('formato_invalido')
      return
    }
    setBusqueda('buscando')
    const trabajador = await buscarTrabajadorPorLegajo(legajoLimpio, hoy())
    if (!trabajador) {
      setBusqueda('no_encontrado')
      return
    }
    setNombre(trabajador.nombre_completo.toUpperCase())
    setBusqueda('encontrado')
  }

  async function agregar() {
    const legajoLimpio = legajo.trim()
    const nombreLimpio = nombre.trim()
    setError(null)
    setMensaje(null)
    if (!LEGAJO_REGEX.test(legajoLimpio)) {
      setError('El legajo debe empezar con "10" seguido del DNI (8 dígitos).')
      return
    }
    if (!nombreLimpio) {
      setError('Falta el nombre completo (búscalo por legajo o escríbelo a mano).')
      return
    }
    if (!zona) {
      setError('Selecciona una zona.')
      return
    }
    setGuardando(true)
    const { error: err } = await asignarPersonalZona(legajoLimpio, nombreLimpio, zona)
    setGuardando(false)
    if (err) {
      setError(err)
      return
    }
    setMensaje(`${nombreLimpio} quedó asignado a ${zona}.`)
    setLegajo('')
    setNombre('')
    setZona('')
    setBusqueda('idle')
    void cargarLista()
  }

  async function quitar(legajoAQuitar: string, nombreAQuitar: string) {
    const confirmado = window.confirm(`¿Quitar la asignación de zona de ${nombreAQuitar}?`)
    if (!confirmado) return
    await quitarPersonalZona(legajoAQuitar)
    void cargarLista()
  }

  const listaFiltrada = (lista ?? []).filter((p) => !filtroZona || p.zona === filtroZona)

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Personal por zona"
        description="Fija la Zona de un trabajador específico: si está en esta lista, sus casos siempre se registran en esa zona, sin importar en qué fundo aparezca trabajando ese día."
      />

      <div className="space-y-4">
        <CardSection title="Asignar" icon={<MapPinned className="size-4 text-brand" />}>
          <div>
            <label htmlFor="pz-legajo" className="block text-[13px] font-medium text-neutral-700 mb-1.5">
              Legajo
            </label>
            <div className="flex gap-2">
              <input
                id="pz-legajo"
                type="text"
                inputMode="numeric"
                maxLength={10}
                placeholder="ej. 1012345678"
                value={legajo}
                onChange={(e) => {
                  setLegajo(e.target.value)
                  setBusqueda('idle')
                }}
                className="input flex-1"
              />
              <Button type="button" variant="primary" onClick={buscarLegajo} loading={busqueda === 'buscando'} className="shrink-0">
                <Search className="size-4" />
                Buscar
              </Button>
            </div>
            {busqueda === 'formato_invalido' && (
              <p className="text-xs text-danger mt-1">El legajo debe empezar con "10" seguido del DNI (8 dígitos).</p>
            )}
            {busqueda === 'encontrado' && (
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="size-3.5 shrink-0" />
                Encontrado en el personal importado.
              </p>
            )}
            {busqueda === 'no_encontrado' && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <AlertCircle className="size-3.5 shrink-0" />
                No aparece en el personal importado — puedes escribir el nombre a mano igual.
              </p>
            )}
          </div>

          <Field label="Nombre completo" value={nombre}>
            <input type="text" placeholder="ej. JUAN PÉREZ LÓPEZ" value={nombre} onChange={(e) => setNombre(e.target.value.toUpperCase())} className="input" />
          </Field>

          <Field label="Zona" value={zona}>
            <select value={zona} onChange={(e) => setZona(e.target.value as Zona | '')} className="input">
              <option value="">Selecciona...</option>
              {ZONAS.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </Field>

          {error && (
            <p className="text-sm text-red-600 flex items-center gap-1.5">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </p>
          )}
          {mensaje && (
            <div className="rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-3 py-2 flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0" />
              {mensaje}
            </div>
          )}

          <Button onClick={agregar} loading={guardando}>
            {guardando ? 'Guardando...' : 'Asignar zona'}
          </Button>
        </CardSection>

        <CardSection title="Personal asignado" icon={<Users className="size-4 text-brand" />}>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setFiltroZona('')}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium border',
                filtroZona === '' ? 'bg-brand text-white border-brand' : 'text-neutral-500 border-neutral-200 hover:border-brand/40',
              )}
            >
              Todas ({lista?.length ?? 0})
            </button>
            {ZONAS.map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setFiltroZona(z)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium border',
                  filtroZona === z ? 'bg-brand text-white border-brand' : 'text-neutral-500 border-neutral-200 hover:border-brand/40',
                )}
              >
                {z} ({(lista ?? []).filter((p) => p.zona === z).length})
              </button>
            ))}
          </div>

          {lista === null ? (
            <p className="text-sm text-neutral-400">Cargando...</p>
          ) : listaFiltrada.length === 0 ? (
            <p className="text-sm text-neutral-400">Sin asignaciones{filtroZona ? ` en ${filtroZona}` : ''} todavía.</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {listaFiltrada.map((p) => (
                <div key={p.legajo} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-800 truncate">{p.nombre_completo}</p>
                    <p className="text-xs text-neutral-400">
                      {p.legajo} · <span className="font-medium text-brand">{p.zona}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => quitar(p.legajo, p.nombre_completo)}
                    aria-label={`Quitar asignación de ${p.nombre_completo}`}
                    className="p-2 rounded-md text-neutral-400 hover:bg-red-50 hover:text-red-600 shrink-0"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardSection>
      </div>
    </div>
  )
}
