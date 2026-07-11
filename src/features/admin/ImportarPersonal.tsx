import { useState } from 'react'
import { leerFilasXlsx } from './leerXlsx'
import { mapearEncabezados, indiceColumnaFecha, type CampoTrabajador } from './personalColumnas'
import { timestampDeCelda } from './parseFecha'
import { LEGAJO_REGEX, dniDesdeLegajo } from '@/data/legajo'
import { supabase } from '@/lib/supabaseClient'
import { pullTrabajadores } from '@/lib/sync'
import type { Trabajador } from '@/types'

type Resultado = {
  validos: Trabajador[]
  filasLeidas: number
  legajosInvalidos: number
  columnasFaltantes: CampoTrabajador[]
}

const OBLIGATORIAS: CampoTrabajador[] = ['legajo', 'nombre_completo']

export function ImportarPersonal() {
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
      const campoPorColumna = mapearEncabezados(encabezados)
      const idxFecha = indiceColumnaFecha(encabezados)

      const columnasFaltantes = OBLIGATORIAS.filter((c) => !campoPorColumna.includes(c))
      if (columnasFaltantes.length > 0) {
        setResultado({ validos: [], filasLeidas: filas.length - 1, legajosInvalidos: 0, columnasFaltantes })
        return
      }

      const idx = (campo: CampoTrabajador) => campoPorColumna.indexOf(campo)
      const idxLegajo = idx('legajo')
      const idxNombre = idx('nombre_completo')
      const idxArea = idx('area')
      const idxFundo = idx('fundo')
      const idxZona = idx('zona')
      const idxGrupo = idx('grupo')
      const idxSupCuadrilla = idx('sup_cuadrilla')

      // TAREO trae muchas filas por trabajador (una por marcación). Nos
      // quedamos con la más reciente por legajo, pero SIEMPRE preferimos una
      // fila con Módulo/Fundo lleno sobre una vacía (ej. marcaciones de
      // vacaciones/permisos no traen fundo y no deben tapar el dato real),
      // y solo entre filas con el mismo estado de "tiene fundo" gana la más reciente.
      const masRecientePorLegajo = new Map<string, { fila: unknown[]; ts: number; tieneFundo: boolean }>()
      let legajosInvalidos = 0

      for (let i = 1; i < filas.length; i++) {
        const fila = filas[i]
        const legajo = String(fila[idxLegajo] ?? '').trim()
        if (!LEGAJO_REGEX.test(legajo)) {
          legajosInvalidos++
          continue
        }
        const ts = idxFecha >= 0 ? timestampDeCelda(fila[idxFecha]) : i
        const tieneFundo = idxFundo >= 0 ? String(fila[idxFundo] ?? '').trim() !== '' : false
        const actual = masRecientePorLegajo.get(legajo)
        const esMejor =
          !actual || (tieneFundo && !actual.tieneFundo) || (tieneFundo === actual.tieneFundo && ts >= actual.ts)
        if (esMejor) {
          masRecientePorLegajo.set(legajo, { fila, ts, tieneFundo })
        }
      }

      const validos: Trabajador[] = [...masRecientePorLegajo.entries()].map(([legajo, { fila }]) => ({
        legajo,
        dni: dniDesdeLegajo(legajo),
        nombre_completo: String(fila[idxNombre] ?? '').trim(),
        area: idxArea >= 0 ? String(fila[idxArea] ?? '').trim() || null : null,
        fundo: idxFundo >= 0 ? String(fila[idxFundo] ?? '').trim() || null : null,
        zona: idxZona >= 0 ? String(fila[idxZona] ?? '').trim() || null : null,
        grupo: idxGrupo >= 0 ? String(fila[idxGrupo] ?? '').trim() || null : null,
        sup_cuadrilla: idxSupCuadrilla >= 0 ? String(fila[idxSupCuadrilla] ?? '').trim() || null : null,
        updated_at: new Date().toISOString(),
      }))

      setResultado({ validos, filasLeidas: filas.length - 1, legajosInvalidos, columnasFaltantes: [] })
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
          .from('trabajadores')
          .upsert(resultado.validos.slice(i, i + lote), { onConflict: 'legajo' })
        if (upsertError) throw new Error(upsertError.message)
      }
      await pullTrabajadores()
      setMensaje(`Cargado: ${resultado.validos.length} trabajadores actualizados/agregados.`)
      setResultado(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir a la base de datos.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Importar personal (TAREO)</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Sube el Excel de TAREO (reporte de auditoría móvil). Se usa la fila más reciente de cada
          Legajo para autocompletar Nombre, Fundo, Grupo y Sup. cuadrilla en "Nueva atención".
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Archivo Excel (.xlsx)</label>
        <input type="file" accept=".xlsx" onChange={onFileSelected} className="input" />
      </div>

      {procesando && <p className="text-sm text-neutral-500">Procesando archivo...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {mensaje && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-3 py-2">
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
        <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-2">
          <p className="text-sm text-neutral-700">Filas leídas: {resultado.filasLeidas}</p>
          <p className="text-sm text-neutral-700">Trabajadores únicos válidos: {resultado.validos.length}</p>
          {resultado.legajosInvalidos > 0 && (
            <p className="text-sm text-amber-600">
              Filas descartadas por legajo inválido: {resultado.legajosInvalidos}
            </p>
          )}
          <button
            onClick={confirmarCarga}
            disabled={cargando || resultado.validos.length === 0}
            className="rounded-md bg-brand text-white px-4 py-2 text-sm font-medium hover:bg-brand-light disabled:opacity-50"
          >
            {cargando ? 'Cargando...' : `Confirmar carga (${resultado.validos.length})`}
          </button>
        </div>
      )}
    </div>
  )
}
