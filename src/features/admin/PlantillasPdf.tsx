import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, FileText, Loader2, Pencil, Trash2, Upload } from 'lucide-react'
import {
  listarPlantillas,
  subirPlantilla,
  actualizarPosicionesPlantilla,
  eliminarPlantilla,
  descargarBytesPlantilla,
} from '@/lib/plantillasApi'
import { useAuth } from '@/features/auth/AuthContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { CardSection, Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { PosicionadorPlantilla } from './PosicionadorPlantilla'
import type { PlantillaPdf, PosicionCampoPlantilla } from '@/types'

const CAMPOS_TOTALES = 4

type EstadoEditor =
  | { abierto: false }
  | { abierto: true; plantilla: PlantillaPdf; bytes: ArrayBuffer }

export function PlantillasPdf() {
  const { profile } = useAuth()
  const [plantillas, setPlantillas] = useState<PlantillaPdf[] | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [nombreNuevo, setNombreNuevo] = useState('')
  const [archivoNuevo, setArchivoNuevo] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [errorSubida, setErrorSubida] = useState<string | null>(null)

  const [editor, setEditor] = useState<EstadoEditor>({ abierto: false })
  const [cargandoEditor, setCargandoEditor] = useState(false)
  const [guardandoPosiciones, setGuardandoPosiciones] = useState(false)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    const { data, error: err } = await listarPlantillas()
    setPlantillas(data)
    setError(err)
    setCargando(false)
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function subir() {
    if (!profile || !archivoNuevo || !nombreNuevo.trim()) return
    setErrorSubida(null)
    setSubiendo(true)
    const { data, error: err } = await subirPlantilla(nombreNuevo.trim(), archivoNuevo, profile.id, profile.nombre_completo)
    if (err || !data) {
      setSubiendo(false)
      setErrorSubida(`No se pudo subir: ${err}`)
      return
    }
    const bytes = await archivoNuevo.arrayBuffer()
    setSubiendo(false)
    setNombreNuevo('')
    setArchivoNuevo(null)
    void cargar()
    // Abre directo el posicionador: recién subida, todavía no tiene ningún
    // campo configurado, así que conviene ubicarlos ya mismo.
    setEditor({ abierto: true, plantilla: data, bytes })
  }

  async function abrirEditor(plantilla: PlantillaPdf) {
    setCargandoEditor(true)
    const { bytes, error: err } = await descargarBytesPlantilla(plantilla.storage_path)
    setCargandoEditor(false)
    if (err || !bytes) {
      setError(`No se pudo abrir la plantilla: ${err}`)
      return
    }
    setEditor({ abierto: true, plantilla, bytes })
  }

  async function guardarPosiciones(posiciones: PosicionCampoPlantilla[]) {
    if (!editor.abierto) return
    setGuardandoPosiciones(true)
    const { error: err } = await actualizarPosicionesPlantilla(editor.plantilla.id, posiciones)
    setGuardandoPosiciones(false)
    if (err) {
      setError(`No se pudieron guardar las posiciones: ${err}`)
      return
    }
    setEditor({ abierto: false })
    void cargar()
  }

  async function eliminar(plantilla: PlantillaPdf) {
    const confirmado = window.confirm(`¿Eliminar la plantilla "${plantilla.nombre}"? Esta acción no se puede deshacer.`)
    if (!confirmado) return
    setEliminandoId(plantilla.id)
    const { error: err } = await eliminarPlantilla(plantilla)
    setEliminandoId(null)
    if (err) {
      setError(`No se pudo eliminar: ${err}`)
      return
    }
    void cargar()
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Plantillas PDF"
        description="Sube un PDF y marca dónde va el nombre, DNI, celular y fecha. Después se genera para cualquier trabajador desde Herramientas > Generar documento."
      />

      <div className="space-y-4">
        <CardSection title="Subir plantilla nueva" icon={<Upload className="size-4 text-brand" />}>
          <Field label="Nombre de la plantilla">
            <input
              type="text"
              placeholder="Carta inductiva"
              value={nombreNuevo}
              onChange={(e) => setNombreNuevo(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Archivo PDF">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setArchivoNuevo(e.target.files?.[0] ?? null)}
              className="input"
            />
          </Field>
          {errorSubida && (
            <p className="text-sm text-danger flex items-center gap-1.5">
              <AlertCircle className="size-4 shrink-0" />
              {errorSubida}
            </p>
          )}
          <Button onClick={subir} loading={subiendo} disabled={!archivoNuevo || !nombreNuevo.trim()}>
            {subiendo ? 'Subiendo...' : 'Subir y configurar posiciones'}
          </Button>
        </CardSection>

        {error && (
          <p className="text-sm text-danger flex items-center gap-1.5">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </p>
        )}

        {cargando && !plantillas ? (
          <Card className="p-10 flex items-center justify-center">
            <Loader2 className="size-6 text-brand animate-spin" />
          </Card>
        ) : plantillas && plantillas.length > 0 ? (
          <Card className="divide-y divide-neutral-100">
            {plantillas.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex items-start gap-2.5">
                  <FileText className="size-4 text-brand shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-800 truncate">{p.nombre}</p>
                    <p className="text-xs text-neutral-400">
                      {p.posiciones.length} / {CAMPOS_TOTALES} campos configurados
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button variant="secondary" onClick={() => abrirEditor(p)} loading={cargandoEditor} className="p-2.5" aria-label="Configurar posiciones">
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="danger" onClick={() => eliminar(p)} loading={eliminandoId === p.id} className="p-2.5" aria-label="Eliminar">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        ) : (
          <Card className="p-10 flex flex-col items-center text-center gap-2">
            <FileText className="size-10 text-neutral-300" />
            <p className="text-sm font-medium text-neutral-700">Todavía no hay plantillas</p>
            <p className="text-sm text-neutral-500">Sube un PDF arriba para empezar.</p>
          </Card>
        )}
      </div>

      {editor.abierto && (
        <Modal title={`Posiciones · ${editor.plantilla.nombre}`} onClose={() => setEditor({ abierto: false })} size="lg">
          <PosicionadorPlantilla
            bytes={editor.bytes}
            posicionesIniciales={editor.plantilla.posiciones}
            guardando={guardandoPosiciones}
            onGuardar={guardarPosiciones}
            onCancelar={() => setEditor({ abierto: false })}
          />
        </Modal>
      )}
    </div>
  )
}
