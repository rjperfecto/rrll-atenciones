import { useEffect, useState } from 'react'
import { FileText, RotateCcw, Save, AlertCircle, CheckCircle2 } from 'lucide-react'
import { CAMPOS_CARTA_COMPROMISOS, CAMPOS_CARTA_VERIFICACION, type CampoTextoCarta360 } from '@/data/textosCartas360'
import { obtenerTextosCarta, guardarTextosCarta, type DocumentoCarta360 } from '@/lib/textosCartasApi'
import { useAuth } from '@/features/auth/AuthContext'
import { cn } from '@/lib/cn'
import { PageHeader } from '@/components/ui/PageHeader'
import { CardSection } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const DOCUMENTOS: { id: DocumentoCarta360; etiqueta: string; campos: CampoTextoCarta360[] }[] = [
  { id: 'COMPROMISOS', etiqueta: 'Carta de compromisos', campos: CAMPOS_CARTA_COMPROMISOS },
  { id: 'VERIFICACION', etiqueta: 'Carta de verificación', campos: CAMPOS_CARTA_VERIFICACION },
]

// Edita la redacción de los párrafos/títulos de texto fijo de las dos
// cartas de 360 Laboral (ver src/data/textosCartas360.ts, que define el
// catálogo de campos editables, y los generadores cartaCompromisos360.ts/
// cartaVerificacion360.ts, que ya no traen el texto hardcodeado). Las
// listas de alertas/compromisos, el encabezado (logo, fecha, destinatario)
// y las firmas se arman solas, no viven acá.
export function TextosCartas360() {
  const { profile } = useAuth()
  const [documentoId, setDocumentoId] = useState<DocumentoCarta360>('COMPROMISOS')
  const documento = DOCUMENTOS.find((d) => d.id === documentoId)!

  const [valores, setValores] = useState<Record<string, string>>({})
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    setCargando(true)
    setGuardado(false)
    setError(null)
    void obtenerTextosCarta(documentoId).then((overrides) => {
      if (cancelado) return
      const base: Record<string, string> = {}
      for (const campo of documento.campos) base[campo.id] = overrides[campo.id] ?? campo.defaultTexto
      setValores(base)
      setCargando(false)
    })
    return () => {
      cancelado = true
    }
    // documento se recalcula a partir de documentoId, no hace falta en las deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentoId])

  function restablecer(campo: CampoTextoCarta360) {
    setValores((prev) => ({ ...prev, [campo.id]: campo.defaultTexto }))
    setGuardado(false)
  }

  async function guardar() {
    if (!profile) return
    setGuardando(true)
    setError(null)
    // Solo se guardan los campos que realmente quedaron distintos del texto
    // por defecto — ver comentario en textosCartasApi.ts.
    const textosNuevos: Record<string, string> = {}
    for (const campo of documento.campos) {
      const valor = (valores[campo.id] ?? '').trim()
      if (valor && valor !== campo.defaultTexto) textosNuevos[campo.id] = valor
    }
    const { error: err } = await guardarTextosCarta(documentoId, textosNuevos, profile.id, profile.nombre_completo)
    setGuardando(false)
    if (err) {
      setError(err)
      return
    }
    setGuardado(true)
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Textos de cartas 360"
        description="Edita la redacción de los párrafos y títulos fijos de la Carta de compromisos y la Carta de verificación de 360 Laboral. Las listas de alertas/compromisos, el encabezado y las firmas se arman solas, no se editan acá."
      />

      <div className="flex gap-2 mb-4">
        {DOCUMENTOS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setDocumentoId(d.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
              documentoId === d.id ? 'bg-brand text-white border-brand' : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50',
            )}
          >
            {d.etiqueta}
          </button>
        ))}
      </div>

      {cargando ? (
        <p className="text-sm text-neutral-400">Cargando...</p>
      ) : (
        <div className="space-y-4">
          <CardSection title={documento.etiqueta} icon={<FileText className="size-4 text-brand" />}>
            <div className="space-y-5">
              {documento.campos.map((campo) => (
                <div key={campo.id}>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label className="text-[13px] font-medium text-neutral-700">{campo.etiqueta}</label>
                    {valores[campo.id] !== campo.defaultTexto && (
                      <button
                        type="button"
                        onClick={() => restablecer(campo)}
                        className="text-xs text-neutral-400 hover:text-neutral-600 flex items-center gap-1 shrink-0"
                      >
                        <RotateCcw className="size-3" />
                        Restablecer
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={campo.id.toLowerCase().includes('titulo') ? 1 : 3}
                    value={valores[campo.id] ?? ''}
                    onChange={(e) => {
                      const valor = e.target.value
                      setValores((prev) => ({ ...prev, [campo.id]: valor }))
                      setGuardado(false)
                    }}
                    className="input"
                  />
                  {campo.ayuda && <p className="text-xs text-neutral-400 mt-1">{campo.ayuda}</p>}
                </div>
              ))}
            </div>
          </CardSection>

          {error && (
            <p className="text-sm text-danger flex items-center gap-1.5">
              <AlertCircle className="size-4 shrink-0" />
              No se pudo guardar: {error}
            </p>
          )}
          {guardado && (
            <p className="text-sm text-success flex items-center gap-1.5">
              <CheckCircle2 className="size-4 shrink-0" />
              Guardado. Se va a usar desde la próxima carta que se genere.
            </p>
          )}

          <Button onClick={guardar} loading={guardando}>
            <Save className="size-4" />
            Guardar cambios
          </Button>
        </div>
      )}
    </div>
  )
}
