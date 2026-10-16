import { useState } from 'react'
import { AlertCircle, CheckCircle2, Download, Loader2, Plus, Trash2, Users } from 'lucide-react'
import { buscarGrupoCompleto, type PersonaGrupo } from '@/lib/busquedaApi'
import { descargarBytesPlantilla } from '@/lib/plantillasApi'
import { generarPdfConDatos, descargarZip } from '@/lib/generarPdf'
import { textoDatos, textoFecha } from '@/lib/plantillaTextos'
import { dniDesdeLegajo } from '@/data/legajo'
import { SelectorPlantilla } from './SelectorPlantilla'
import { CardSection } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import type { PlantillaPdf, CampoPlantilla } from '@/types'

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

// Documento masivo: se arma una lista de trabajadores agregando grupos
// completos (botón "+", por Grupo + Fecha), se puede sacar a alguien puntual
// de la lista con "-", y al generar sale un .pdf por cada uno, todos juntos
// en un .zip (ver descargarZip).
export function DocumentoMasivo({ plantillas }: { plantillas: PlantillaPdf[] | null }) {
  const [plantillaId, setPlantillaId] = useState('')
  const [grupo, setGrupo] = useState('')
  const [fecha, setFecha] = useState(hoy())
  const [buscandoGrupo, setBuscandoGrupo] = useState(false)
  const [errorGrupo, setErrorGrupo] = useState<string | null>(null)
  const [seleccionados, setSeleccionados] = useState<PersonaGrupo[]>([])
  const [generando, setGenerando] = useState(false)
  const [errorGenerar, setErrorGenerar] = useState<string | null>(null)
  const [generado, setGenerado] = useState<number | null>(null)

  const plantilla = plantillas?.find((p) => p.id === plantillaId) ?? null
  const plantillaIncompleta = plantilla !== null && plantilla.posiciones.length === 0

  async function agregarGrupo() {
    const texto = grupo.trim()
    setErrorGrupo(null)
    setGenerado(null)
    if (!texto) return
    setBuscandoGrupo(true)
    const r = await buscarGrupoCompleto(texto, fecha)
    setBuscandoGrupo(false)
    if (!r) {
      setErrorGrupo(`No encontré personal registrado en el grupo "${texto.toUpperCase()}" para el ${fecha}.`)
      return
    }
    // Líder + soportes + cosechadores: todo el personal del grupo ese día.
    // Si alguno no tiene legajo propio ubicado (ej. líder sin su fila de
    // TAREO ese día), se descarta: sin legajo no se puede sacar su DNI.
    const nuevos = [...(r.lider ? [r.lider] : []), ...r.soportes, ...r.cosechadores].filter((p) => p.legajo)
    setSeleccionados((prev) => {
      const existentes = new Set(prev.map((p) => p.legajo))
      return [...prev, ...nuevos.filter((p) => !existentes.has(p.legajo))]
    })
  }

  function quitar(legajo: string) {
    setSeleccionados((prev) => prev.filter((p) => p.legajo !== legajo))
  }

  async function generarTodos() {
    if (!plantilla || seleccionados.length === 0) return
    setErrorGenerar(null)
    setGenerado(null)
    setGenerando(true)
    try {
      const { bytes, error: err } = await descargarBytesPlantilla(plantilla.storage_path)
      if (err || !bytes) throw new Error(err ?? 'No se pudo descargar la plantilla.')
      const archivos: Record<string, Uint8Array> = {}
      for (const t of seleccionados) {
        const valores: Record<CampoPlantilla, string> = {
          datos: textoDatos(t.nombre_completo, dniDesdeLegajo(t.legajo), t.telefono ?? ''),
          fecha: textoFecha(fecha),
        }
        const pdfBytes = await generarPdfConDatos(bytes, plantilla.posiciones, valores)
        // Legajo en el nombre del archivo para no pisar PDFs entre sí si dos
        // trabajadores comparten nombre y apellido.
        archivos[`${t.nombre_completo} - ${t.legajo}.pdf`] = pdfBytes
      }
      descargarZip(archivos, `${plantilla.nombre} - ${grupo.trim().toUpperCase()} - ${fecha}.zip`)
      setGenerado(seleccionados.length)
    } catch (err) {
      setErrorGenerar(err instanceof Error ? err.message : 'No se pudieron generar los documentos.')
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="space-y-4">
      <SelectorPlantilla plantillas={plantillas} plantillaId={plantillaId} onChange={setPlantillaId} />

      <CardSection title="Agregar grupo" icon={<Users className="size-4 text-brand" />}>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
          <Field label="Grupo">
            <input
              type="text"
              placeholder="CH12"
              value={grupo}
              onChange={(e) => setGrupo(e.target.value.toUpperCase())}
              className="input"
            />
          </Field>
          <Field label="Fecha">
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="input" />
          </Field>
          <Button type="button" onClick={agregarGrupo} loading={buscandoGrupo} disabled={!grupo.trim()} className="shrink-0">
            <Plus className="size-4" />
            Agregar
          </Button>
        </div>
        {errorGrupo && (
          <p className="text-xs text-danger flex items-center gap-1.5">
            <AlertCircle className="size-3.5 shrink-0" />
            {errorGrupo}
          </p>
        )}
        <p className="text-xs text-neutral-400">Se va a imprimir como "{textoFecha(fecha)}" en todos los documentos.</p>
      </CardSection>

      <CardSection title={`Trabajadores (${seleccionados.length})`} icon={<Users className="size-4 text-brand" />}>
        {seleccionados.length === 0 ? (
          <p className="text-sm text-neutral-400">Agrega uno o más grupos arriba para armar la lista.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {seleccionados.map((t) => (
              <li key={t.legajo} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm text-neutral-800 truncate">{t.nombre_completo}</p>
                  <p className="text-xs text-neutral-400">
                    {t.legajo} · DNI {dniDesdeLegajo(t.legajo)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => quitar(t.legajo)}
                  className="p-1.5 rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-danger shrink-0"
                  aria-label={`Quitar a ${t.nombre_completo}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardSection>

      {errorGenerar && (
        <p className="text-sm text-danger flex items-center gap-1.5">
          <AlertCircle className="size-4 shrink-0" />
          {errorGenerar}
        </p>
      )}
      {generado !== null && (
        <p className="text-sm text-success flex items-center gap-1.5">
          <CheckCircle2 className="size-4 shrink-0" />
          {generado} documento{generado === 1 ? '' : 's'} generado{generado === 1 ? '' : 's'} y descargado{generado === 1 ? '' : 's'} en un .zip.
        </p>
      )}

      <Button onClick={generarTodos} loading={generando} disabled={!plantilla || plantillaIncompleta || seleccionados.length === 0}>
        {generando ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Generando...
          </>
        ) : (
          <>
            <Download className="size-4" />
            Generar {seleccionados.length > 0 ? `(${seleccionados.length})` : ''} documentos
          </>
        )}
      </Button>
    </div>
  )
}
