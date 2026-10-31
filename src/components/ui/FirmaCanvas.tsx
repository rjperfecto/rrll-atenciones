import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Eraser, PenLine } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

const ALTO_CANVAS = 200
// Factor de resolución fija (no window.devicePixelRatio, que varía por
// equipo): asegura una firma nítida en cualquier celular sin complicar el
// cálculo de coordenadas, que ya es sensible porque el canvas se estira a
// 100% del ancho disponible.
const ESCALA_RESOLUCION = 2

// Firma táctil: el dedo (o mouse/lápiz, vía Pointer Events — mismo manejo
// para los tres) dibuja trazos en un <canvas> con fondo transparente, para
// que al incrustarse en el PDF (ver generarPdf.ts) solo se vea la tinta, no
// un rectángulo blanco encima de la plantilla.
export function FirmaCanvas({
  titulo,
  descripcion,
  onGuardar,
  onCancelar,
}: {
  titulo: string
  descripcion?: string
  onGuardar: (pngBytes: Uint8Array) => void
  onCancelar: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const firmando = useRef(false)
  const [vacio, setVacio] = useState(true)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.lineWidth = 3 * ESCALA_RESOLUCION
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1a2138'
  }, [])

  function coordenadas(e: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) * ESCALA_RESOLUCION
    const y = (e.clientY - rect.top) * ESCALA_RESOLUCION
    return { x, y }
  }

  function empezar(e: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    canvas.setPointerCapture(e.pointerId)
    firmando.current = true
    const { x, y } = coordenadas(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function dibujar(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!firmando.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = coordenadas(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    setVacio(false)
  }

  function terminar() {
    firmando.current = false
  }

  function limpiar() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setVacio(true)
  }

  function guardar() {
    const canvas = canvasRef.current
    if (!canvas || vacio) return
    setGuardando(true)
    canvas.toBlob(async (blob) => {
      setGuardando(false)
      if (!blob) return
      onGuardar(new Uint8Array(await blob.arrayBuffer()))
    }, 'image/png')
  }

  return (
    <Modal title={titulo} description={descripcion} onClose={onCancelar} size="lg">
      <div className="space-y-3">
        <p className="text-xs text-neutral-500 flex items-center gap-1.5">
          <PenLine className="size-3.5 shrink-0" />
          Firme con el dedo dentro del recuadro.
        </p>
        <canvas
          ref={canvasRef}
          width={800}
          height={ALTO_CANVAS * ESCALA_RESOLUCION}
          style={{ height: ALTO_CANVAS, touchAction: 'none' }}
          className="w-full rounded-md border-2 border-dashed border-neutral-300 bg-neutral-50 cursor-crosshair"
          onPointerDown={empezar}
          onPointerMove={dibujar}
          onPointerUp={terminar}
          onPointerLeave={terminar}
          onPointerCancel={terminar}
        />
        <div className="flex justify-between gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={limpiar} disabled={vacio}>
            <Eraser className="size-4" />
            Limpiar
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onCancelar}>
              Cancelar
            </Button>
            <Button type="button" onClick={guardar} loading={guardando} disabled={vacio}>
              {guardando ? 'Guardando...' : 'Confirmar firma'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
