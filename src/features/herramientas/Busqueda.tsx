import { useState, type FormEvent } from 'react'
import { AlertCircle, Crown, MapPin, Phone, Search, Shield, Sprout, User } from 'lucide-react'
import { buscarGrupoCompleto, buscarPorLegajo, type ResultadoGrupo, type ResultadoTrabajador } from '@/lib/busquedaApi'
import { LEGAJO_REGEX } from '@/data/legajo'
import { PageHeader } from '@/components/ui/PageHeader'
import { CardSection, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

type Modo = 'GRUPO' | 'LEGAJO'

function fechaLegible(fecha: string) {
  const [anio, mes, dia] = fecha.split('-')
  return `${dia}/${mes}/${anio}`
}

function TelefonoTexto({ telefono }: { telefono: string | null }) {
  if (!telefono) return <span className="text-neutral-400 italic">Sin celular registrado</span>
  return (
    <a href={`tel:${telefono}`} className="inline-flex items-center gap-1 text-brand hover:underline">
      <Phone className="size-3.5" />
      {telefono}
    </a>
  )
}

function DatosAlAviso({ fecha }: { fecha: string }) {
  return (
    <p className="text-xs text-neutral-400 border-t border-neutral-100 pt-3 mt-1">
      Datos de personal al {fechaLegible(fecha)} (última carga disponible, no necesariamente hoy).
    </p>
  )
}

export function Busqueda() {
  const [modo, setModo] = useState<Modo>('GRUPO')
  const [valor, setValor] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultadoGrupo, setResultadoGrupo] = useState<ResultadoGrupo | null>(null)
  const [resultadoTrabajador, setResultadoTrabajador] = useState<ResultadoTrabajador | null>(null)

  function cambiarModo(nuevo: Modo) {
    setModo(nuevo)
    setValor('')
    setError(null)
    setResultadoGrupo(null)
    setResultadoTrabajador(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const texto = valor.trim()
    if (!texto) return
    setError(null)
    setResultadoGrupo(null)
    setResultadoTrabajador(null)
    setBuscando(true)
    try {
      if (modo === 'GRUPO') {
        const r = await buscarGrupoCompleto(texto)
        if (!r) setError(`No encontré personal registrado en el grupo "${texto.toUpperCase()}".`)
        else setResultadoGrupo(r)
      } else {
        if (!LEGAJO_REGEX.test(texto)) {
          setError('El legajo debe empezar con "10" seguido del DNI (8 dígitos).')
          return
        }
        const r = await buscarPorLegajo(texto)
        if (!r) setError(`No encontré personal registrado con el legajo "${texto}".`)
        else setResultadoTrabajador(r)
      }
    } finally {
      setBuscando(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Búsqueda de personal"
        description="Encuentra la ubicación, el líder y los celulares de contacto de un grupo, o los datos de un trabajador específico."
      />

      <div className="space-y-4">
        <CardSection title="Buscar" icon={<Search className="size-4 text-brand" />}>
          <div className="inline-flex rounded-lg border border-neutral-200 p-1 bg-neutral-50 self-start">
            <button
              type="button"
              onClick={() => cambiarModo('GRUPO')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                modo === 'GRUPO' ? 'bg-white text-brand shadow-sm' : 'text-neutral-500',
              )}
            >
              Grupo completo
            </button>
            <button
              type="button"
              onClick={() => cambiarModo('LEGAJO')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                modo === 'LEGAJO' ? 'bg-white text-brand shadow-sm' : 'text-neutral-500',
              )}
            >
              Trabajador (legajo)
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder={modo === 'GRUPO' ? 'CH67, CH01, ZS298' : '1076432706'}
              className="input flex-1"
              autoCapitalize={modo === 'GRUPO' ? 'characters' : 'none'}
            />
            <Button type="submit" loading={buscando} disabled={!valor.trim()}>
              {buscando ? 'Buscando...' : 'Buscar'}
            </Button>
          </form>

          {error && (
            <p className="text-sm text-red-600 flex items-center gap-1.5">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </p>
          )}
        </CardSection>

        {resultadoGrupo && <ResultadoGrupoCard resultado={resultadoGrupo} />}
        {resultadoTrabajador && <ResultadoTrabajadorCard resultado={resultadoTrabajador} />}
      </div>
    </div>
  )
}

function ResultadoGrupoCard({ resultado }: { resultado: ResultadoGrupo }) {
  return (
    <Card className="p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <h3 className="text-lg font-semibold text-navy">{resultado.grupo}</h3>
        {resultado.ubicacion && (
          <span className="inline-flex items-center gap-1 text-sm text-neutral-500">
            <MapPin className="size-3.5" />
            {resultado.ubicacion}
          </span>
        )}
      </div>

      <div className="rounded-lg bg-gold-soft/60 border border-amber-200 px-3 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 flex items-center gap-1.5 mb-1">
          <Crown className="size-3.5" />
          Líder
        </p>
        {resultado.lider ? (
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            {resultado.lider.legajo && (
              <span className="font-mono text-xs text-neutral-400">{resultado.lider.legajo}</span>
            )}
            <span className="text-sm font-medium text-neutral-800">{resultado.lider.nombre_completo}</span>
            <span className="text-sm">
              <TelefonoTexto telefono={resultado.lider.telefono} />
            </span>
          </div>
        ) : (
          <p className="text-sm text-neutral-400 italic">No hay líder registrado para este grupo.</p>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 flex items-center gap-1.5 mb-1.5">
          <Shield className="size-3.5" />
          Soportes ({resultado.soportes.length})
        </p>
        {resultado.soportes.length > 0 ? (
          <ul className="text-sm text-neutral-700 space-y-1">
            {resultado.soportes.map((p) => (
              <li key={p.legajo}>
                <span className="font-mono text-xs text-neutral-400 mr-2">{p.legajo}</span>
                {p.nombre_completo}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-400 italic">Sin soportes registrados.</p>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 flex items-center gap-1.5 mb-1.5">
          <Sprout className="size-3.5" />
          Cosechadores ({resultado.cosechadores.length})
        </p>
        {resultado.cosechadores.length > 0 ? (
          <ul className="text-sm text-neutral-700 space-y-1">
            {resultado.cosechadores.map((p) => (
              <li key={p.legajo}>
                <span className="font-mono text-xs text-neutral-400 mr-2">{p.legajo}</span>
                {p.nombre_completo}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-400 italic">Sin cosechadores registrados.</p>
        )}
      </div>

      <DatosAlAviso fecha={resultado.fecha} />
    </Card>
  )
}

function ResultadoTrabajadorCard({ resultado }: { resultado: ResultadoTrabajador }) {
  return (
    <Card className="p-4 sm:p-5 space-y-4">
      {resultado.grupo && (
        <div className="flex items-center gap-1.5 text-sm text-neutral-500">
          <MapPin className="size-3.5" />
          Grupo <span className="font-semibold text-navy">{resultado.grupo}</span>
        </div>
      )}

      <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 flex items-center gap-1.5 mb-1">
          <User className="size-3.5" />
          Trabajador
        </p>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className="text-sm font-medium text-neutral-800">{resultado.nombre_completo}</span>
          <span className="text-sm">
            <TelefonoTexto telefono={resultado.telefono} />
          </span>
        </div>
      </div>

      <div className="rounded-lg bg-gold-soft/60 border border-amber-200 px-3 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 flex items-center gap-1.5 mb-1">
          <Crown className="size-3.5" />
          Supervisor
        </p>
        {resultado.supervisor ? (
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span className="text-sm font-medium text-neutral-800">{resultado.supervisor.nombre_completo}</span>
            <span className="text-sm">
              <TelefonoTexto telefono={resultado.supervisor.telefono} />
            </span>
          </div>
        ) : (
          <p className="text-sm text-neutral-400 italic">No hay supervisor registrado.</p>
        )}
      </div>

      <DatosAlAviso fecha={resultado.fecha} />
    </Card>
  )
}
