import { useEffect, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { AlertCircle } from 'lucide-react'
import { Modal } from './Modal'

const ELEMENT_ID = 'rrll-qr-reader'

// Lector de QR/código de barras vía la cámara del celular (fotocheck del
// trabajador), usando html5-qrcode (soporta QR y los formatos de barras más
// comunes sin tener que saber de antemano cuál usa el carnet).
export function BarcodeScannerModal({
  onDetected,
  onClose,
}: {
  onDetected: (texto: string) => void
  onClose: () => void
}) {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const scanner = new Html5Qrcode(ELEMENT_ID)
    let cancelado = false

    // React (StrictMode, en desarrollo) puede montar y desmontar este efecto
    // dos veces seguidas. start() es asíncrono: si el cleanup llamara a
    // stop() antes de que start() termine de resolver, html5-qrcode lanza
    // "Cannot stop, scanner is not running or paused." sin capturar, lo que
    // rompe la página. Encadenar el stop() directamente sobre la promesa de
    // start() garantiza que nunca se llame antes de tiempo.
    //
    // Sin "qrbox": se probó con qrbox (recuadro de escaneo) y el mapeo de
    // coordenadas fallaba de forma silenciosa (nunca detectaba, sin error).
    // Escaneando el cuadro completo si detecta de forma confiable (verificado
    // con un QR real); el recuadro visual de abajo es solo una guía, no
    // limita la zona de escaneo real.
    const iniciar = scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10 },
        (textoDetectado) => {
          if (cancelado) return
          cancelado = true
          onDetected(textoDetectado.trim())
        },
        () => {
          // Callback de "no se detectó nada en este frame": es normal que se
          // dispare constantemente mientras se apunta la cámara, se ignora.
        },
      )
      .catch(() => {
        if (!cancelado) setError('No se pudo acceder a la cámara. Revisa los permisos del navegador para este sitio.')
      })

    return () => {
      cancelado = true
      iniciar
        .then(() => scanner.stop())
        .then(() => scanner.clear())
        .catch(() => {})
    }
  }, [onDetected])

  return (
    <Modal title="Escanear carnet del trabajador" onClose={onClose}>
      <div className="space-y-3">
        <div className="relative rounded-md overflow-hidden bg-neutral-900 aspect-square">
          <div id={ELEMENT_ID} className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
          {!error && (
            <div className="pointer-events-none absolute inset-8 border-2 border-white/70 rounded-lg" />
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1.5">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </p>
        )}
        {!error && <p className="text-xs text-neutral-500">Apunta la cámara al código del carnet.</p>}
      </div>
    </Modal>
  )
}
