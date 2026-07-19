import { useState } from 'react'
import { AlertCircle, CheckCircle2, Upload } from 'lucide-react'
import { leerFilasXlsx } from './leerXlsx'
import { mapearEncabezadosAfiliados, esContingenciaAfiliado, type CampoAfiliado } from './afiliadosColumnas'
import { LEGAJO_REGEX } from '@/data/legajo'
import { supabase } from '@/lib/supabaseClient'
import { PageHeader } from '@/components/ui/PageHeader'
import { CardSection, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { Afiliado } from '@/types'

type Resultado = {
  validos: Afiliado[]
  filasLeidas: number
  legajosInvalidos: number
  columnasFaltantes: CampoAfiliado[]
  totalAfiliados: number
  totalNoAfiliados: number
}

const OBLIGATORIAS: CampoAfiliado[] = ['legajo', 'contingencia']

export function ImportarAfiliados() {
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setProcesando(true)
    setError(null)
    setMensaje(null)
    setResultado(null)
    try {
      const filas = await leerFilasXlsx(file)
      if (filas.length < 2) throw new Error('El archivo no tiene filas de datos.')

      const encabezados = filas[0].map((c) => String(c ?? ''))
      const campoPorColumna = mapearEncabezadosAfiliados(encabezados)
      const columnasFaltantes = OBLIGATORIAS.filter((c) => !campoPorColumna.includes(c))
      if (columnasFaltantes.length > 0) {
        setResultado({
          validos: [],
          filasLeidas: filas.length - 1,
          legajosInvalidos: 0,
          columnasFaltantes,
          totalAfiliados: 0,
          totalNoAfiliados: 0,
        })
        return
      }

      const idx = (campo: CampoAfiliado) => campoPorColumna.indexOf(campo)
      const idxLegajo = idx('legajo')
      const idxNombre = idx('nombre_completo')
      const idxContingencia = idx('contingencia')

      // Si el mismo legajo aparece más de una vez (typos/duplicados en el
      // Excel), gana la última fila del archivo — se sobreescribe al
      // recorrer en orden, sin lógica extra.
      const porLegajo = new Map<string, Afiliado>()
      let legajosInvalidos = 0

      for (let i = 1; i < filas.length; i++) {
        const fila = filas[i]
        const legajo = String(fila[idxLegajo] ?? '').trim()
        if (!LEGAJO_REGEX.test(legajo)) {
          legajosInvalidos++
          continue
        }
        porLegajo.set(legajo, {
          legajo,
          nombre_completo: idxNombre >= 0 ? String(fila[idxNombre] ?? '').trim() : '',
          es_afiliado: esContingenciaAfiliado(String(fila[idxContingencia] ?? '')),
          updated_at: new Date().toISOString(),
        })
      }

      const validos = [...porLegajo.values()]
      setResultado({
        validos,
        filasLeidas: filas.length - 1,
        legajosInvalidos,
        columnasFaltantes: [],
        totalAfiliados: validos.filter((v) => v.es_afiliado).length,
        totalNoAfiliados: validos.filter((v) => !v.es_afiliado).length,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo leer el archivo.')
    } finally {
      setProcesando(false)
      e.target.value = ''
    }
  }

  async function confirmarCarga() {
    if (!resultado || resultado.validos.length === 0) return
    setCargando(true)
    setError(null)
    try {
      const lote = 500
      for (let i = 0; i < resultado.validos.length; i += lote) {
        const { error: upsertError } = await supabase
          .from('afiliados')
          .upsert(resultado.validos.slice(i, i + lote), { onConflict: 'legajo' })
        if (upsertError) throw new Error(upsertError.message)
      }
      setMensaje(`Cargado: ${resultado.validos.length} legajos actualizados/agregados.`)
      setResultado(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir a la base de datos.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="max-w-xl">
      <PageHeader
        title="Importar afiliados"
        description='Sube el Excel de AFILIADOS (columnas LEGAJO y CONTINGENCIA). Se actualiza el estado de afiliación por legajo: "AFILIADO" queda como SI, cualquier otro valor (EXAFILIADO, DESAFILIADO, etc.) queda como NO.'
      />

      <div className="space-y-4">
        <CardSection title="Archivo" icon={<Upload className="size-4 text-brand" />}>
          <input type="file" accept=".xlsx" onChange={onFileSelected} className="input" />
          {procesando && <p className="text-sm text-neutral-500">Procesando archivo...</p>}
        </CardSection>

        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1.5">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </p>
        )}
        {mensaje && (
          <div className="rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-3 py-2 flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            {mensaje}
          </div>
        )}

        {resultado && resultado.columnasFaltantes.length > 0 && (
          <p className="text-sm text-red-600">
            Al archivo le faltan columnas obligatorias: {resultado.columnasFaltantes.join(', ')}. Revisa los
            encabezados del Excel.
          </p>
        )}

        {resultado && resultado.columnasFaltantes.length === 0 && (
          <Card className="p-4 space-y-2">
            <p className="text-sm text-neutral-700">Filas leídas: {resultado.filasLeidas}</p>
            <p className="text-sm text-neutral-700">Legajos únicos válidos: {resultado.validos.length}</p>
            <p className="text-sm text-neutral-700">
              Afiliados: {resultado.totalAfiliados} · No afiliados: {resultado.totalNoAfiliados}
            </p>
            {resultado.legajosInvalidos > 0 && (
              <p className="text-sm text-amber-600">Filas descartadas por legajo inválido: {resultado.legajosInvalidos}</p>
            )}
            <Button onClick={confirmarCarga} loading={cargando} disabled={resultado.validos.length === 0}>
              {cargando ? 'Cargando...' : `Confirmar carga (${resultado.validos.length})`}
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}
