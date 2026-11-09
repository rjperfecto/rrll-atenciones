import { useState } from 'react'
import { AlertCircle, CheckCircle2, Download, Loader2, PenLine, Search } from 'lucide-react'
import { buscarPorLegajo, type ResultadoTrabajador } from '@/lib/busquedaApi'
import { descargarBytesPlantilla } from '@/lib/plantillasApi'
import { obtenerFirmaPersonal, descargarBytesFirmaPersonal, type FirmaPersonal } from '@/lib/firmasPersonalApi'
import { generarPdfConDatos, descargarPdf, type FirmaParaPdf } from '@/lib/generarPdf'
import { textoDatos, textoFecha } from '@/lib/plantillaTextos'
import { LEGAJO_REGEX, dniDesdeLegajo } from '@/data/legajo'
import { SelectorPlantilla } from './SelectorPlantilla'
import { CardSection, Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import type { PlantillaPdf } from '@/types'

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

export function DocumentoIndividual({ plantillas }: { plantillas: PlantillaPdf[] | null }) {
  const [plantillaId, setPlantillaId] = useState('')
  const [legajo, setLegajo] = useState('')
  const [fecha, setFecha] = useState(hoy())
  const [trabajador, setTrabajador] = useState<ResultadoTrabajador | null>(null)
  const [firma, setFirma] = useState<FirmaPersonal | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null)
  const [generando, setGenerando] = useState(false)
  const [errorGenerar, setErrorGenerar] = useState<string | null>(null)
  const [generado, setGenerado] = useState(false)

  const plantilla = plantillas?.find((p) => p.id === plantillaId) ?? null
  const plantillaIncompleta = plantilla !== null && plantilla.posiciones.length === 0

  async function buscar() {
    const texto = legajo.trim()
    setErrorBusqueda(null)
    setTrabajador(null)
    setFirma(null)
    setGenerado(false)
    if (!LEGAJO_REGEX.test(texto)) {
      setErrorBusqueda('El legajo debe empezar con "10" seguido del DNI (8 dígitos).')
      return
    }
    setBuscando(true)
    const [r, firmaEncontrada] = await Promise.all([buscarPorLegajo(texto), obtenerFirmaPersonal(texto)])
    setBuscando(false)
    if (!r) {
      setErrorBusqueda(`No encontré personal registrado con el legajo "${texto}".`)
      return
    }
    setTrabajador(r)
    setFirma(firmaEncontrada)
  }

  async function generar() {
    if (!plantilla || !trabajador) return
    setErrorGenerar(null)
    setGenerado(false)
    setGenerando(true)
    try {
      const { bytes, error: err } = await descargarBytesPlantilla(plantilla.storage_path)
      if (err || !bytes) throw new Error(err ?? 'No se pudo descargar la plantilla.')
      const valores = {
        datos: textoDatos(trabajador.nombre_completo, dniDesdeLegajo(trabajador.legajo), trabajador.telefono ?? ''),
        fecha: textoFecha(fecha),
      }
      // Si el trabajador tiene una firma guardada (Administración > Firmas de
      // personal), se inserta sola en el campo "firma" de la plantilla; si no
      // tiene, ese campo queda vacío, igual que antes.
      let datosFirma: FirmaParaPdf | null = null
      if (firma) {
        const { bytes: firmaBytes } = await descargarBytesFirmaPersonal(firma.storage_path)
        if (firmaBytes) {
          datosFirma = { png: new Uint8Array(firmaBytes), nombre: trabajador.nombre_completo, dni: dniDesdeLegajo(trabajador.legajo) }
        }
      }
      const pdfBytes = await generarPdfConDatos(bytes, plantilla.posiciones, valores, datosFirma)
      descargarPdf(pdfBytes, `${plantilla.nombre} - ${trabajador.nombre_completo}.pdf`)
      setGenerado(true)
    } catch (err) {
      setErrorGenerar(err instanceof Error ? err.message : 'No se pudo generar el PDF.')
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="space-y-4">
      <SelectorPlantilla plantillas={plantillas} plantillaId={plantillaId} onChange={setPlantillaId} />

      <CardSection title="Trabajador" icon={<Search className="size-4 text-brand" />}>
        <div>
          <label htmlFor="campo-legajo-doc" className="block text-[13px] font-medium text-neutral-700 mb-1.5">
            Legajo
          </label>
          <div className="flex gap-2">
            <input
              id="campo-legajo-doc"
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="1012345678"
              value={legajo}
              onChange={(e) => {
                setLegajo(e.target.value)
                setTrabajador(null)
                setGenerado(false)
              }}
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
        </div>

        {trabajador && (
          <Card className="p-3 bg-neutral-50 space-y-1">
            <p className="text-sm font-medium text-neutral-800">{trabajador.nombre_completo}</p>
            <p className="text-xs text-neutral-500">DNI: {dniDesdeLegajo(trabajador.legajo)}</p>
            <p className="text-xs text-neutral-500">
              Celular: {trabajador.telefono ?? <span className="italic text-neutral-400">sin registrar</span>}
            </p>
            <p className="text-xs flex items-center gap-1.5 pt-0.5">
              <PenLine className="size-3.5 shrink-0" />
              {firma ? (
                <span className="text-success">Tiene firma guardada, se va a usar en el PDF.</span>
              ) : (
                <span className="text-neutral-400">Sin firma guardada (el campo de firma quedará vacío).</span>
              )}
            </p>
          </Card>
        )}

        <Field label="Fecha">
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="input" />
        </Field>
        <p className="text-xs text-neutral-400">Se va a imprimir como "{textoFecha(fecha)}".</p>
      </CardSection>

      {errorGenerar && (
        <p className="text-sm text-danger flex items-center gap-1.5">
          <AlertCircle className="size-4 shrink-0" />
          {errorGenerar}
        </p>
      )}
      {generado && (
        <p className="text-sm text-success flex items-center gap-1.5">
          <CheckCircle2 className="size-4 shrink-0" />
          PDF generado y descargado.
        </p>
      )}

      <Button onClick={generar} loading={generando} disabled={!plantilla || plantillaIncompleta || !trabajador}>
        {generando ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Generando...
          </>
        ) : (
          <>
            <Download className="size-4" />
            Generar PDF
          </>
        )}
      </Button>
    </div>
  )
}
