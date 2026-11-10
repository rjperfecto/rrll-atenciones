import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, PenLine, Trash2, Upload, Users } from 'lucide-react'
import { listarUsuarios } from '@/lib/personalZonaApi'
import { obtenerFirmaPersonal, subirFirmaPersonal, eliminarFirmaPersonal, descargarBytesFirmaPersonal, type FirmaPersonal } from '@/lib/firmasPersonalApi'
import { useAuth } from '@/features/auth/AuthContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { CardSection, Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import type { Profile } from '@/types'

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

// Firma de cada USUARIO de la plataforma (no de trabajadores buscados por
// legajo, ver migración 0042): se usa para firmar con la firma del propio
// responsable los documentos que genera en Herramientas > Documento.
export function FirmasPersonal() {
  const { profile } = useAuth()
  const [usuarios, setUsuarios] = useState<Profile[] | null>(null)
  const [usuarioId, setUsuarioId] = useState('')
  const [firma, setFirma] = useState<FirmaPersonal | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [cargandoFirma, setCargandoFirma] = useState(false)

  const [archivoNuevo, setArchivoNuevo] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [errorSubida, setErrorSubida] = useState<string | null>(null)
  const [subido, setSubido] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  const usuario = usuarios?.find((u) => u.id === usuarioId) ?? null

  useEffect(() => {
    void listarUsuarios().then(setUsuarios)
  }, [])

  // Al elegir un usuario, se trae su firma guardada (si tiene).
  useEffect(() => {
    setArchivoNuevo(null)
    setSubido(false)
    setErrorSubida(null)
    if (!usuarioId) {
      setFirma(null)
      return
    }
    let cancelado = false
    setCargandoFirma(true)
    void obtenerFirmaPersonal(usuarioId).then((f) => {
      if (!cancelado) {
        setFirma(f)
        setCargandoFirma(false)
      }
    })
    return () => {
      cancelado = true
    }
  }, [usuarioId])

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

  async function subir() {
    if (!profile || !usuario || !archivoNuevo) return
    setErrorSubida(null)
    setSubiendo(true)
    try {
      const png = await archivoAPng(archivoNuevo)
      const { error: err } = await subirFirmaPersonal(usuario.id, png, profile.id, profile.nombre_completo)
      if (err) throw new Error(err)
      setFirma(await obtenerFirmaPersonal(usuario.id))
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
    const confirmado = window.confirm(`¿Eliminar la firma guardada de ${usuario?.nombre_completo}? Esta acción no se puede deshacer.`)
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
        description="Carga la imagen de la firma de un usuario de la plataforma: se usa automáticamente al generar documentos en Herramientas > Documento con su propia firma."
      />

      <div className="space-y-4">
        <CardSection title="Usuario" icon={<Users className="size-4 text-brand" />}>
          {usuarios === null ? (
            <p className="text-sm text-neutral-400">Cargando usuarios...</p>
          ) : (
            <Field label="Elige el usuario">
              <select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)} className="input">
                <option value="">Selecciona...</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre_completo} ({u.rol})
                  </option>
                ))}
              </select>
            </Field>
          )}
        </CardSection>

        {usuario && (
          <CardSection title="Firma" icon={<PenLine className="size-4 text-brand" />}>
            <Card className="p-3 bg-neutral-50 space-y-1">
              <p className="text-sm font-medium text-neutral-800">{usuario.nombre_completo}</p>
              <p className="text-xs text-neutral-500">{usuario.email}</p>
            </Card>

            {cargandoFirma ? (
              <p className="text-xs text-neutral-400">Cargando firma...</p>
            ) : (
              <>
                {previewUrl && (
                  <div>
                    <p className="text-xs text-neutral-500 mb-1.5">Firma guardada actualmente:</p>
                    <div className="rounded-lg border border-neutral-200 bg-white p-3 flex items-center justify-center">
                      <img src={previewUrl} alt={`Firma de ${usuario.nombre_completo}`} className="max-h-24" />
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
              </>
            )}
          </CardSection>
        )}
      </div>
    </div>
  )
}
