import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'
import { AlertCircle, MousePointerClick } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { textoDatos, textoFecha, INTERLINEADO_PLANTILLA } from '@/lib/plantillaTextos'
import type { CampoPlantilla, PosicionCampoPlantilla } from '@/types'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

const CAMPOS: { id: CampoPlantilla; etiqueta: string; muestra: string }[] = [
  { id: 'datos', etiqueta: 'Datos (Señor/DNI/Celular)', muestra: textoDatos('JUAN PÉREZ LÓPEZ', '12345678', '987654321') },
  { id: 'fecha', etiqueta: 'Fecha', muestra: textoFecha('2026-10-16') },
]

const ESCALA = 1.4
const TAMANO_DEFAULT = 10.5

// Edita dónde va cada dato dentro de la plantilla: se renderiza la página 1
// con pdf.js en un <canvas>, y un click ahí coloca/mueve el marcador del
// campo seleccionado en la barra de arriba. Las coordenadas se convierten de
// píxeles del canvas a puntos PDF (origen abajo-izquierda) porque eso es lo
// que pdf-lib necesita al generar el documento final (ver DocumentoIndividual/DocumentoMasivo).
export function PosicionadorPlantilla({
  bytes,
  posicionesIniciales,
  guardando,
  onGuardar,
  onCancelar,
}: {
  bytes: ArrayBuffer
  posicionesIniciales: PosicionCampoPlantilla[]
  guardando: boolean
  onGuardar: (posiciones: PosicionCampoPlantilla[]) => void
  onCancelar: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const [alturaPaginaPt, setAlturaPaginaPt] = useState<number | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [posiciones, setPosiciones] = useState<PosicionCampoPlantilla[]>(posicionesIniciales)
  const [campoActivo, setCampoActivo] = useState<CampoPlantilla>('datos')

  useEffect(() => {
    let cancelado = false
    async function render() {
      setCargando(true)
      setError(null)
      try {
        // pdf.js necesita su propio ArrayBuffer (lo consume al parsear).
        const doc = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise
        const pagina = await doc.getPage(1)
        const viewport = pagina.getViewport({ scale: ESCALA })
        const canvas = canvasRef.current
        const overlay = overlayRef.current
        if (!canvas || !overlay || cancelado) return
        canvas.width = viewport.width
        canvas.height = viewport.height
        overlay.width = viewport.width
        overlay.height = viewport.height
        const contexto = canvas.getContext('2d')
        if (!contexto) return
        await pagina.render({ canvas, canvasContext: contexto, viewport }).promise
        if (!cancelado) setAlturaPaginaPt(viewport.height / ESCALA)
      } catch (err) {
        if (!cancelado) setError(err instanceof Error ? err.message : 'No se pudo mostrar el PDF.')
      } finally {
        if (!cancelado) setCargando(false)
      }
    }
    void render()
    return () => {
      cancelado = true
    }
  }, [bytes])

  // Dibuja los marcadores en un canvas transparente aparte (no con divs de
  // CSS encima): fillText del canvas ancla el texto igual que pdf-lib —
  // (x, y) es la base (baseline) izquierda del texto — así la vista previa
  // queda en el mismo punto exacto que el PDF final, no "más o menos ahí".
  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay || alturaPaginaPt === null) return
    const ctx = overlay.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, overlay.width, overlay.height)
    ctx.textBaseline = 'alphabetic'
    for (const p of posiciones) {
      const campo = CAMPOS.find((c) => c.id === p.campo)
      if (!campo) continue
      const xCanvas = p.x * ESCALA
      const yCanvas = (alturaPaginaPt - p.y) * ESCALA
      const tamanoPx = p.tamano * ESCALA
      const interlineadoPx = tamanoPx * INTERLINEADO_PLANTILLA
      ctx.font = `bold ${tamanoPx}px Arial, Helvetica, sans-serif`
      const lineas = campo.muestra.split('\n')
      const activo = p.campo === campoActivo
      const anchoMax = Math.max(...lineas.map((l) => ctx.measureText(l).width))
      const alto = tamanoPx + (lineas.length - 1) * interlineadoPx
      ctx.fillStyle = activo ? 'rgba(103, 58, 183, 0.18)' : 'rgba(251, 191, 36, 0.3)'
      ctx.fillRect(xCanvas - 2, yCanvas - tamanoPx, anchoMax + 4, alto * 1.25)
      if (activo) {
        ctx.strokeStyle = '#673ab7'
        ctx.lineWidth = 1.5
        ctx.strokeRect(xCanvas - 2, yCanvas - tamanoPx, anchoMax + 4, alto * 1.25)
      }
      ctx.fillStyle = '#111827'
      lineas.forEach((linea, i) => ctx.fillText(linea, xCanvas, yCanvas + i * interlineadoPx))
    }
  }, [posiciones, campoActivo, alturaPaginaPt])

  function colocarCampo(e: React.MouseEvent<HTMLDivElement>) {
    if (alturaPaginaPt === null) return
    const rect = e.currentTarget.getBoundingClientRect()
    const xCanvas = e.clientX - rect.left
    const yCanvas = e.clientY - rect.top
    const x = xCanvas / ESCALA
    const y = alturaPaginaPt - yCanvas / ESCALA
    setPosiciones((prev) => {
      const sinEsteCampo = prev.filter((p) => p.campo !== campoActivo)
      const tamano = prev.find((p) => p.campo === campoActivo)?.tamano ?? TAMANO_DEFAULT
      return [...sinEsteCampo, { campo: campoActivo, pagina: 1, x, y, tamano }]
    })
  }

  function cambiarTamano(campo: CampoPlantilla, tamano: number) {
    setPosiciones((prev) => prev.map((p) => (p.campo === campo ? { ...p, tamano } : p)))
  }

  function quitarCampo(campo: CampoPlantilla) {
    setPosiciones((prev) => prev.filter((p) => p.campo !== campo))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {CAMPOS.map((c) => {
          const posicion = posiciones.find((p) => p.campo === c.id)
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCampoActivo(c.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors',
                campoActivo === c.id ? 'bg-brand text-white border-brand' : 'bg-white text-neutral-700 border-neutral-200 hover:border-brand/40',
              )}
            >
              {c.etiqueta}
              {posicion && <span className="ml-1.5 opacity-70">✓</span>}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-xs text-neutral-500 flex items-center gap-1.5">
          Tamaño de letra ({CAMPOS.find((c) => c.id === campoActivo)?.etiqueta}):
          <input
            type="number"
            min={6}
            max={48}
            step={0.5}
            value={posiciones.find((p) => p.campo === campoActivo)?.tamano ?? TAMANO_DEFAULT}
            onChange={(e) => cambiarTamano(campoActivo, Number(e.target.value))}
            className="input w-16 py-1"
          />
        </label>
        {posiciones.some((p) => p.campo === campoActivo) && (
          <button type="button" onClick={() => quitarCampo(campoActivo)} className="text-xs text-danger hover:underline">
            Quitar este campo
          </button>
        )}
      </div>

      <p className="text-xs text-neutral-500 flex items-center gap-1.5">
        <MousePointerClick className="size-3.5 shrink-0" />
        Elige un campo arriba y toca el PDF donde quieres que aparezca.
      </p>

      {error && (
        <p className="text-sm text-danger flex items-center gap-1.5">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </p>
      )}

      <div className="relative inline-block border border-neutral-200 rounded-md overflow-auto max-h-[60vh] max-w-full">
        {cargando && <p className="p-6 text-sm text-neutral-400">Cargando vista previa...</p>}
        <div className="relative" onClick={colocarCampo}>
          <canvas ref={canvasRef} className="block cursor-crosshair" />
          <canvas ref={overlayRef} className="absolute inset-0 pointer-events-none" />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="button" onClick={() => onGuardar(posiciones)} loading={guardando}>
          {guardando ? 'Guardando...' : 'Guardar posiciones'}
        </Button>
      </div>
    </div>
  )
}
