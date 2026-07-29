import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { cerrarCompromiso } from '@/lib/atencionesApi'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { estadoDeCampo, CLASE_INPUT_POR_ESTADO } from '@/lib/campoEstado'
import type { Atencion } from '@/types'

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

// A diferencia de "Cerrar caso" (Atenciones), un compromiso no usa un
// catálogo de acción correctiva: solo pide cómo se resolvió y cuándo.
export function CerrarCompromisoModal({ atencion, onClose }: { atencion: Atencion; onClose: () => void }) {
  const [resultado, setResultado] = useState('')
  const [fechaCierre, setFechaCierre] = useState(hoy())
  const [tocado, setTocado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const estadoResultado = estadoDeCampo(resultado, tocado && !resultado ? 'Obligatorio' : undefined)

  async function confirmar() {
    setTocado(true)
    if (!resultado.trim()) return
    setGuardando(true)
    setError(null)
    const { error: err } = await cerrarCompromiso(atencion.id, {
      resultado_compromiso: resultado.toUpperCase(),
      fecha_cierre: fechaCierre,
      updated_at: new Date().toISOString(),
    })
    if (err) {
      setError(`No se pudo cerrar el compromiso: ${err}`)
      setGuardando(false)
      return
    }
    onClose()
  }

  return (
    <Modal
      title="Cerrar compromiso"
      description={`${atencion.lider_cosecha ?? ''} · ${atencion.zona}`}
      onClose={onClose}
    >
      <div className="space-y-4">
        <Field label="Cómo se cerró" value={resultado} error={estadoResultado === 'warning' ? 'Obligatorio' : undefined}>
          <textarea
            rows={4}
            value={resultado}
            onChange={(e) => setResultado(e.target.value.toUpperCase())}
            onBlur={() => setTocado(true)}
            className={CLASE_INPUT_POR_ESTADO[estadoResultado] ? `input ${CLASE_INPUT_POR_ESTADO[estadoResultado]}` : 'input'}
          />
        </Field>
        <Field label="Fecha de cierre" value={fechaCierre}>
          <input type="date" value={fechaCierre} onChange={(e) => setFechaCierre(e.target.value)} className="input" />
        </Field>

        {error && (
          <p className="text-sm text-danger flex items-center gap-1.5">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={confirmar} loading={guardando}>
            {guardando ? 'Cerrando...' : 'Confirmar cierre'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
