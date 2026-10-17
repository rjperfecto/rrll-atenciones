import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { AlertCircle, CalendarDays, ChevronLeft, ChevronRight, Loader2, Plus, RefreshCw } from 'lucide-react'
import { listarCapacitacionesRango } from '@/lib/capacitacionesApi'
import { hexDeColor } from '@/data/coloresAgenda'
import { COLORES_AGENDA } from '@/data/coloresAgenda'
import {
  SLOTS_AGENDA,
  HORAS_FIN_AGENDA,
  diasDeLaSemana,
  filaDeHora,
  duracionEnFilas,
  rangoSemanaLegible,
  aHoraCorta,
} from './agendaHoras'
import { CapacitacionModal } from './CapacitacionModal'
import { useAuth } from '@/features/auth/AuthContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import type { Capacitacion } from '@/types'

const ANCHO_COL_HORAS = 56
const ANCHO_MIN_COL_DIA = 140
const ALTO_FILA = 60
const ALTO_ENCABEZADO = 56

// Google Calendar usa "Google Sans" (propietaria, no está en Google Fonts
// para uso web) en su interfaz — Roboto es su tipografía pública, la que
// Calendar sí usa para el texto de los eventos en la grilla.
const FUENTE_AGENDA = "'Roboto', ui-sans-serif, system-ui, sans-serif"

// Letra blanca con contorno negro (pedido explícito): -webkit-text-stroke
// dibuja un borde real alrededor de cada letra (a diferencia de apilar
// text-shadow, que a este tamaño de letra queda débil/borroso y el texto
// termina viéndose apenas) — se lee igual sobre cualquiera de los 11
// colores de la paleta, incluso los más claros (Plátano, Lavanda).
const CONTORNO_TEXTO: CSSProperties = {
  fontFamily: FUENTE_AGENDA,
  WebkitTextStroke: '0.6px #000',
  paintOrder: 'stroke fill',
  textShadow: '0 1px 1px rgba(0,0,0,0.6)',
}

type EstadoModal =
  | { abierto: false }
  | {
      abierto: true
      existente: Capacitacion | null
      soloLectura: boolean
      fecha: string
      horaInicio: string
      horaFin: string
    }

export function AgendaCapacitaciones() {
  const { profile } = useAuth()
  const [semanaBase, setSemanaBase] = useState(() => new Date())
  const [capacitaciones, setCapacitaciones] = useState<Capacitacion[] | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<EstadoModal>({ abierto: false })

  const dias = useMemo(() => diasDeLaSemana(semanaBase), [semanaBase])

  const cargar = useCallback(async () => {
    setCargando(true)
    const { data, error: err } = await listarCapacitacionesRango(dias[0].fecha, dias[dias.length - 1].fecha)
    setCapacitaciones(data)
    setError(err)
    setCargando(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dias[0].fecha, dias[dias.length - 1].fecha])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const porDia = useMemo(() => {
    const mapa = new Map<string, Capacitacion[]>()
    for (const c of capacitaciones ?? []) {
      const lista = mapa.get(c.fecha) ?? []
      lista.push(c)
      mapa.set(c.fecha, lista)
    }
    return mapa
  }, [capacitaciones])

  function cambiarSemana(delta: number) {
    setSemanaBase((d) => {
      const nueva = new Date(d)
      nueva.setDate(nueva.getDate() + delta * 7)
      return nueva
    })
  }

  function abrirNuevo(fecha: string, horaInicio: string) {
    const horaFin = HORAS_FIN_AGENDA.find((h) => h > horaInicio) ?? HORAS_FIN_AGENDA[HORAS_FIN_AGENDA.length - 1]
    setModal({ abierto: true, existente: null, soloLectura: false, fecha, horaInicio, horaFin })
  }

  function abrirExistente(c: Capacitacion) {
    const puedeEditar = profile?.id === c.creado_por || profile?.rol === 'ADMIN'
    setModal({
      abierto: true,
      existente: c,
      soloLectura: !puedeEditar,
      fecha: c.fecha,
      horaInicio: aHoraCorta(c.hora_inicio),
      horaFin: aHoraCorta(c.hora_fin),
    })
  }

  function cerrarModal() {
    setModal({ abierto: false })
  }

  function onGuardado() {
    cerrarModal()
    void cargar()
  }

  const hoyStr = new Date().toISOString().slice(0, 10)

  return (
    <div>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <PageHeader title="Capacitaciones" description="Reuniones y capacitaciones de la semana." />
        <Button variant="secondary" onClick={() => setSemanaBase(new Date())}>
          <CalendarDays className="size-4" />
          Hoy
        </Button>
      </div>

      <Card className="p-3 mb-4 flex items-center justify-between gap-3">
        <button onClick={() => cambiarSemana(-1)} aria-label="Semana anterior" className="p-2 rounded-md text-neutral-500 hover:bg-neutral-100">
          <ChevronLeft className="size-5" />
        </button>
        <span className="text-sm font-medium text-neutral-700">{rangoSemanaLegible(dias)}</span>
        <button onClick={() => cambiarSemana(1)} aria-label="Semana siguiente" className="p-2 rounded-md text-neutral-500 hover:bg-neutral-100">
          <ChevronRight className="size-5" />
        </button>
      </Card>

      {error && (
        <Card className="p-6 flex flex-col items-center text-center gap-2 mb-4">
          <AlertCircle className="size-8 text-red-300" />
          <p className="text-sm text-neutral-600">{error}</p>
          <Button variant="secondary" onClick={cargar}>
            <RefreshCw className="size-4" />
            Reintentar
          </Button>
        </Card>
      )}

      {cargando && !capacitaciones ? (
        <Card className="p-10 flex items-center justify-center">
          <Loader2 className="size-6 text-brand animate-spin" />
        </Card>
      ) : (
        !error && (
          <Card className="p-0 overflow-x-auto">
            <div
              className="grid relative"
              style={{
                gridTemplateColumns: `${ANCHO_COL_HORAS}px repeat(${dias.length}, minmax(${ANCHO_MIN_COL_DIA}px, 1fr))`,
                gridTemplateRows: `${ALTO_ENCABEZADO}px repeat(${SLOTS_AGENDA.length}, ${ALTO_FILA}px)`,
                fontFamily: FUENTE_AGENDA,
              }}
            >
              {/* esquina */}
              <div
                className="sticky left-0 z-20 bg-white border-b border-r border-neutral-100"
                style={{ gridColumn: 1, gridRow: 1 }}
              />

              {/* encabezados de día */}
              {dias.map((d, i) => {
                const esHoy = d.fecha === hoyStr
                return (
                  <div
                    key={d.fecha}
                    style={{ gridColumn: i + 2, gridRow: 1 }}
                    className={cn('flex flex-col items-center justify-center gap-0.5 border-b border-neutral-100 bg-white', esHoy && 'bg-brand/5')}
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{d.etiqueta}</span>
                    <span
                      className={cn(
                        'flex items-center justify-center size-6 rounded-full text-sm font-semibold',
                        esHoy ? 'bg-brand text-white' : 'text-navy',
                      )}
                    >
                      {d.diaNumero}
                    </span>
                  </div>
                )
              })}

              {/* etiquetas de hora: centradas EXACTO sobre la línea que separa
                  esta fila de la anterior (no "dentro" de la fila), para que
                  quede claro a qué hora empieza cada bloque. */}
              {SLOTS_AGENDA.map((hora, i) => (
                <div key={hora} style={{ gridColumn: 1, gridRow: i + 2 }} className="sticky left-0 z-20 relative bg-white border-r border-neutral-100">
                  <span className="absolute right-1.5 top-0 -translate-y-1/2 bg-white px-0.5 text-[10px] text-neutral-400 leading-none">
                    {hora}
                  </span>
                </div>
              ))}

              {/* celdas clickeables (fondo) */}
              {dias.map((d, di) =>
                SLOTS_AGENDA.map((hora, si) => (
                  <button
                    key={`${d.fecha}-${hora}`}
                    type="button"
                    onClick={() => abrirNuevo(d.fecha, hora)}
                    style={{ gridColumn: di + 2, gridRow: si + 2 }}
                    className="border-b border-r border-neutral-100 hover:bg-neutral-50 active:bg-neutral-100"
                    aria-label={`Nueva reunión ${d.fecha} ${hora}`}
                  />
                )),
              )}

              {/* eventos (pintan encima de las celdas clickeables por orden de
                  aparición): tarjeta de un solo color sólido (pedido
                  explícito) — Responsable y Tema centrados en el medio
                  (Responsable destacado, más grande), Ubicación abajo en
                  una franja del color clarito. */}
              {dias.map((d, di) =>
                (porDia.get(d.fecha) ?? []).map((ev) => {
                  const hex = hexDeColor(ev.color)
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => abrirExistente(ev)}
                      style={{
                        gridColumn: di + 2,
                        gridRow: `${filaDeHora(ev.hora_inicio) + 2} / span ${duracionEnFilas(ev.hora_inicio, ev.hora_fin)}`,
                      }}
                      className="m-0.5 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col text-left"
                    >
                      <span
                        className="flex-1 min-h-0 flex flex-col items-center justify-center gap-0.5 px-1 py-1 overflow-hidden"
                        style={{ backgroundColor: hex }}
                      >
                        <span className="w-full font-bold text-[12px] leading-tight text-white text-center truncate" style={CONTORNO_TEXTO}>
                          {ev.responsable}
                        </span>
                        <span className="w-full font-medium text-[10px] leading-tight text-white text-center overflow-hidden" style={CONTORNO_TEXTO}>
                          <span className="line-clamp-2">{ev.tema}</span>
                        </span>
                      </span>
                      <span
                        className="shrink-0 font-semibold text-[9px] leading-tight text-center truncate px-1 py-0.5"
                        style={{ backgroundColor: `color-mix(in srgb, ${hex} 30%, white)`, color: '#1a2138' }}
                      >
                        {ev.ubicacion}
                      </span>
                    </button>
                  )
                }),
              )}
            </div>
          </Card>
        )
      )}

      <div className="flex flex-wrap items-center gap-3 mt-4">
        <span className="text-xs text-neutral-400">Colores:</span>
        {COLORES_AGENDA.map((c) => (
          <span key={c.id} className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
            <span className="size-3 rounded-full inline-block" style={{ backgroundColor: c.hex }} />
            {c.nombre}
          </span>
        ))}
      </div>

      <p className="text-xs text-neutral-400 mt-2 flex items-center gap-1.5">
        <Plus className="size-3.5" />
        Toca una celda vacía para agendar una reunión.
      </p>

      {modal.abierto && profile && (
        <CapacitacionModal
          existente={modal.existente}
          soloLectura={modal.soloLectura}
          creadorId={profile.id}
          creadorNombre={profile.nombre_completo}
          valoresIniciales={{
            fecha: modal.fecha,
            horaInicio: modal.horaInicio,
            horaFin: modal.horaFin,
            responsable: modal.existente?.responsable ?? '',
            tema: modal.existente?.tema ?? '',
            ubicacion: modal.existente?.ubicacion ?? '',
            color: modal.existente?.color ?? COLORES_AGENDA[0].id,
          }}
          onClose={cerrarModal}
          onGuardado={onGuardado}
        />
      )}
    </div>
  )
}
