import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ClipboardList, Crown, MapPin, MessageCircle, Phone, Search, Shield, Sprout, User } from 'lucide-react'
import { buscarGrupoCompleto, buscarPorLegajo, type ResultadoGrupo, type ResultadoTrabajador } from '@/lib/busquedaApi'
import { LEGAJO_REGEX } from '@/data/legajo'
import { PageHeader } from '@/components/ui/PageHeader'
import { CardSection, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/cn'

type Modo = 'GRUPO' | 'LEGAJO'

// Forma común de "persona con la que se puede actuar": llamar, escribir por
// WhatsApp o derivar a un registro de Atención. legajo puede faltar (ej. el
// supervisor de un trabajador, si no se encontró su propia fila de TAREO).
type Persona = { legajo: string | null; nombre_completo: string; telefono: string | null }

function fechaLegible(fecha: string) {
  const [anio, mes, dia] = fecha.split('-')
  return `${dia}/${mes}/${anio}`
}

function DatosAlAviso({ fecha }: { fecha: string }) {
  return (
    <p className="text-xs text-neutral-400 border-t border-neutral-100 pt-3 mt-1">
      Datos de personal al {fechaLegible(fecha)} (última carga disponible, no necesariamente hoy).
    </p>
  )
}

// Botón de llamada grande (fácil de tocar en celular, a diferencia del link
// de texto chico que había antes). Azul para supervisor/líder, verde para el
// trabajador — así se distinguen de un vistazo en la misma pantalla.
function BotonLlamar({ telefono, color }: { telefono: string | null; color: 'blue' | 'green' }) {
  if (!telefono) return <p className="text-sm text-neutral-400 italic">Sin celular registrado</p>
  return (
    <a
      href={`tel:${telefono}`}
      className={cn(
        'flex items-center justify-center gap-2 rounded-lg text-white font-medium text-sm py-2.5 px-4 transition-colors',
        color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700',
      )}
    >
      <Phone className="size-4" />
      Llamar · {telefono}
    </a>
  )
}

// Fila de una persona dentro de una lista (soportes/cosechadores): antes era
// solo texto con el legajo chico, difícil de tocar en celular. Ahora toda la
// fila es un botón grande que abre el menú de acciones (Atención/Llamar/
// WhatsApp).
function FilaPersona({ persona, onClick }: { persona: Persona; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2 rounded-md -mx-2 px-2 py-2.5 text-left hover:bg-neutral-50 active:bg-neutral-100"
    >
      <span className="font-mono text-xs text-neutral-400 shrink-0">{persona.legajo}</span>
      <span className="text-sm text-neutral-700 truncate">{persona.nombre_completo}</span>
    </button>
  )
}

// Menú de acciones al tocar a una persona: derivar un registro de Atención
// (precarga el legajo en "Registrar"), llamar o escribir por WhatsApp.
function AccionesPersonaModal({ persona, onClose }: { persona: Persona; onClose: () => void }) {
  const navigate = useNavigate()
  const telLimpio = persona.telefono?.replace(/\D/g, '') ?? ''

  return (
    <Modal title={persona.nombre_completo} description={persona.legajo ?? undefined} onClose={onClose} size="sm">
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => {
            onClose()
            navigate(persona.legajo ? `/?legajo=${persona.legajo}` : '/')
          }}
          className="w-full flex items-center gap-2.5 rounded-lg border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
        >
          <ClipboardList className="size-4 text-brand" />
          Atención
        </button>

        {telLimpio ? (
          <>
            <a
              href={`tel:${telLimpio}`}
              className="w-full flex items-center gap-2.5 rounded-lg border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
            >
              <Phone className="size-4 text-blue-600" />
              Llamar
            </a>
            <a
              href={`https://wa.me/51${telLimpio}`}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center gap-2.5 rounded-lg border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
            >
              <MessageCircle className="size-4 text-emerald-600" />
              Hablar por WhatsApp
            </a>
          </>
        ) : (
          <p className="text-xs text-neutral-400 italic px-1">Sin celular registrado: no se puede llamar ni escribir por WhatsApp.</p>
        )}
      </div>
    </Modal>
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
              inputMode={modo === 'GRUPO' ? 'text' : 'numeric'}
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
  const [personaAccion, setPersonaAccion] = useState<Persona | null>(null)

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

      <div className="rounded-lg bg-gold-soft/60 border border-amber-200 px-3 py-2.5 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 flex items-center gap-1.5">
          <Crown className="size-3.5" />
          Líder
        </p>
        {resultado.lider ? (
          <>
            <button
              type="button"
              onClick={() => setPersonaAccion(resultado.lider)}
              className="w-full flex items-baseline gap-2 text-left -mx-1 px-1 py-1 rounded hover:bg-white/60"
            >
              {resultado.lider.legajo && <span className="font-mono text-xs text-neutral-400">{resultado.lider.legajo}</span>}
              <span className="text-sm font-medium text-neutral-800">{resultado.lider.nombre_completo}</span>
            </button>
            <BotonLlamar telefono={resultado.lider.telefono} color="blue" />
          </>
        ) : (
          <p className="text-sm text-neutral-400 italic">No hay líder registrado para este grupo.</p>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 flex items-center gap-1.5 mb-1">
          <Shield className="size-3.5" />
          Soportes ({resultado.soportes.length})
        </p>
        {resultado.soportes.length > 0 ? (
          <div className="divide-y divide-neutral-100">
            {resultado.soportes.map((p) => (
              <FilaPersona key={p.legajo} persona={p} onClick={() => setPersonaAccion(p)} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-400 italic">Sin soportes registrados.</p>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 flex items-center gap-1.5 mb-1">
          <Sprout className="size-3.5" />
          Cosechadores ({resultado.cosechadores.length})
        </p>
        {resultado.cosechadores.length > 0 ? (
          <div className="divide-y divide-neutral-100">
            {resultado.cosechadores.map((p) => (
              <FilaPersona key={p.legajo} persona={p} onClick={() => setPersonaAccion(p)} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-400 italic">Sin cosechadores registrados.</p>
        )}
      </div>

      <DatosAlAviso fecha={resultado.fecha} />

      {personaAccion && <AccionesPersonaModal persona={personaAccion} onClose={() => setPersonaAccion(null)} />}
    </Card>
  )
}

function ResultadoTrabajadorCard({ resultado }: { resultado: ResultadoTrabajador }) {
  const [personaAccion, setPersonaAccion] = useState<Persona | null>(null)
  const trabajador: Persona = { legajo: resultado.legajo, nombre_completo: resultado.nombre_completo, telefono: resultado.telefono }

  return (
    <Card className="p-4 sm:p-5 space-y-4">
      {resultado.grupo && (
        <div className="flex items-center gap-1.5 text-sm text-neutral-500">
          <MapPin className="size-3.5" />
          Grupo <span className="font-semibold text-navy">{resultado.grupo}</span>
        </div>
      )}

      <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-2.5 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 flex items-center gap-1.5">
          <User className="size-3.5" />
          Trabajador
        </p>
        <button
          type="button"
          onClick={() => setPersonaAccion(trabajador)}
          className="w-full text-left -mx-1 px-1 py-1 rounded hover:bg-white"
        >
          <span className="font-mono text-xs text-neutral-400 mr-2">{resultado.legajo}</span>
          <span className="text-sm font-medium text-neutral-800">{resultado.nombre_completo}</span>
        </button>
        <BotonLlamar telefono={resultado.telefono} color="green" />
      </div>

      <div className="rounded-lg bg-gold-soft/60 border border-amber-200 px-3 py-2.5 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 flex items-center gap-1.5">
          <Crown className="size-3.5" />
          Supervisor
        </p>
        {resultado.supervisor ? (
          <>
            <button
              type="button"
              onClick={() => setPersonaAccion(resultado.supervisor)}
              className="w-full text-left text-sm font-medium text-neutral-800 -mx-1 px-1 py-1 rounded hover:bg-white/60"
            >
              {resultado.supervisor.nombre_completo}
            </button>
            <BotonLlamar telefono={resultado.supervisor.telefono} color="blue" />
          </>
        ) : (
          <p className="text-sm text-neutral-400 italic">No hay supervisor registrado.</p>
        )}
      </div>

      <DatosAlAviso fecha={resultado.fecha} />

      {personaAccion && <AccionesPersonaModal persona={personaAccion} onClose={() => setPersonaAccion(null)} />}
    </Card>
  )
}
