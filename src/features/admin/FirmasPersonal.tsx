import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, PenLine, Search, Trash2, Upload } from 'lucide-react'
import { buscarPorLegajo, type ResultadoTrabajador } from '@/lib/busquedaApi'
import { obtenerFirmaPersonal, subirFirmaPersonal, eliminarFirmaPersonal, descargarBytesFirmaPersonal, type FirmaPersonal } from '@/lib/firmasPersonalApi'
import { useAuth } from '@/features/auth/AuthContext'
import { LEGAJO_REGEX, dniDesdeLegajo } from '@/data/legajo'
import { PageHeader } from '@/components/ui/PageHeader'
import { CardSection, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

// La imagen que suba el admin (foto del celular, captura, etc.) puede venir
// en cualquier formato/tamaño: se redibuja en un canvas y se exporta como
// PNG, que es lo único que generarPdfConDatos sabe embeber (pdf-lib
// embedPng). Así no hay que detectar/soportar JPG más adelante.
async function archivoAPng(archivo: File): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(archivo)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo procesar la imagen.')
  ctx.drawImage(bitmap, 0, 0)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('No se pudo convertir la imagen a PNG.')
  return new Uint8Array(await blob.arrayBuffer())
}

export function FirmasPersonal() {
  const { profile } = useAuth()
  const [legajo, setLegajo] = useState('')
  const [trabajador, setTrabajador] = useState<ResultadoTrabajador | null>(null)
  const [firma, setFirma] = useState<FirmaPersonal | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null)

  const [archivoNuevo, setArchivoNuevo] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [errorSubida, setErrorSubida] = useState<string | null>(null)
  const [subido, setSubido] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  // Vista previa de la firma ya guardada: se descarga el PNG del bucket
  // privado y se arma un object URL (no hay URL pública/firmada acá, ver
  // mismo patrón de descarga por bytes en PlantillasPdf).
  useEffect(() => {
    if (!firma) {
      setPreviewUrl(null)
      return
    }
    let cancelado = false
    let url: string | null = null
    void descargarBytesFirmaPersonal(firma.storage_path).then(({ bytes }) => {
      if (cancelado || !bytes) return
      url = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }))
      setPreviewUrl(url)
    })
    return () => {
      cancelado = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [firma])

  async function buscar() {
    const texto = legajo.trim()
    setErrorBusqueda(null)
    setTrabajador(null)
    setFirma(null)
    setArchivoNuevo(null)
    setSubido(false)
    setErrorSubida(null)
    if (!LEGAJO_REGEX.test(texto)) {
      setErrorBusqueda('El legajo debe empezar con "10" seguido del DNI (8 dígitos).')
      return
    }
    setBuscando(true)
    const [resultado, firmaExistente] = await Promise.all([buscarPorLegajo(texto), obtenerFirmaPersonal(texto)])
    setBuscando(false)
    if (!resultado) {
      setErrorBusqueda(`No encontré personal registrado con el legajo "${texto}".`)
      return
    }
    setTrabajador(resultado)
    setFirma(firmaExistente)
  }

  async function subir() {
    if (!profile || !trabajador || !archivoNuevo) return
    setErrorSubida(null)
    setSubiendo(true)
    try {
      const png = await archivoAPng(archivoNuevo)
      const { error: err } = await subirFirmaPersonal(trabajador.legajo, png, profile.id, profile.nombre_completo)
      if (err) throw new Error(err)
      setFirma(await obtenerFirmaPersonal(trabajador.legajo))
      setArchivoNuevo(null)
      setSubido(true)
    } catch (err) {
      setErrorSubida(err instanceof Error ? err.message : 'No se pudo subir la firma.')
    } finally {
      setSubiendo(false)
    }
  }

  async function eliminar() {
    if (!firma) return
    const confirmado = window.confirm(`¿Eliminar la firma guardada de ${trabajador?.nombre_completo}? Esta acción no se puede deshacer.`)
    if (!confirmado) return
    setEliminando(true)
    const { error: err } = await eliminarFirmaPersonal(firma)
    setEliminando(false)
    if (err) {
      setErrorSubida(`No se pudo eliminar: ${err}`)
      return
    }
    setFirma(null)
    setSubido(false)
  }

  return (
    <div className="max-w-xl">
      <PageHeader
        title="Firmas de personal"
        description="Carga la imagen de la firma de un trabajador: se usa automáticamente al generar documentos en Herramientas > Documento."
      />

      <div className="space-y-4">
        <CardSection title="Buscar trabajador" icon={<Search className="size-4 text-brand" />}>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="1012345678"
              value={legajo}
              onChange={(e) => {
                setLegajo(e.target.value)
                setTrabajador(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && buscar()}
              className="input flex-1"
            />
            <Button type="button" onClick={buscar} loading={buscando} className="shrink-0">
              <Search className="size-4" />
              Buscar
            </Button>
          </div>
          {errorBusqueda && (
            <p className="text-xs text-danger mt-1 flex items-center gap-1">
              <AlertCircle className="size-3.5 shrink-0" />
              {errorBusqueda}
            </p>
          )}
        </CardSection>

        {trabajador && (
          <CardSection title="Firma" icon={<PenLine className="size-4 text-brand" />}>
            <Card className="p-3 bg-neutral-50 space-y-1">
              <p className="text-sm font-medium text-neutral-800">{trabajador.nombre_completo}</p>
              <p className="text-xs text-neutral-500">
                {trabajador.legajo} · DNI {dniDesdeLegajo(trabajador.legajo)}
              </p>
            </Card>

            {previewUrl && (
              <div>
                <p className="text-xs text-neutral-500 mb-1.5">Firma guardada actualmente:</p>
                <div className="rounded-lg border border-neutral-200 bg-white p-3 flex items-center justify-center">
                  <img src={previewUrl} alt={`Firma de ${trabajador.nombre_completo}`} className="max-h-24" />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="archivo-firma" className="block text-[13px] font-medium text-neutral-700 mb-1.5">
                {firma ? 'Reemplazar por una imagen nueva' : 'Imagen de la firma'}
              </label>
              <input
                id="archivo-firma"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setArchivoNuevo(e.target.files?.[0] ?? null)
                  setSubido(false)
                }}
                className="input"
              />
              <p className="text-xs text-neutral-400 mt-1">Foto o captura del trazo, sobre fondo claro.</p>
            </div>

            {errorSubida && (
              <p className="text-sm text-danger flex items-center gap-1.5">
                <AlertCircle className="size-4 shrink-0" />
                {errorSubida}
              </p>
            )}
            {subido && (
              <p className="text-sm text-success flex items-center gap-1.5">
                <CheckCircle2 className="size-4 shrink-0" />
                Firma guardada.
              </p>
            )}

            <div className="flex items-center gap-2">
              <Button onClick={subir} loading={subiendo} disabled={!archivoNuevo}>
                <Upload className="size-4" />
                {firma ? 'Guardar nueva firma' : 'Guardar firma'}
              </Button>
              {firma && (
                <Button variant="danger" onClick={eliminar} loading={eliminando}>
                  <Trash2 className="size-4" />
                  Eliminar
                </Button>
              )}
            </div>
          </CardSection>
        )}
      </div>
    </div>
  )
}
