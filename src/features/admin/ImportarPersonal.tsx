import { useState } from 'react'
import { AlertCircle, CheckCircle2, Upload } from 'lucide-react'
import { leerFilasXlsx } from './leerXlsx'
import { mapearEncabezados, indiceColumnaFecha, type CampoTrabajador } from './personalColumnas'
import { timestampDeCelda, fechaSoloDia } from './parseFecha'
import { LEGAJO_REGEX, dniDesdeLegajo } from '@/data/legajo'
import { supabase } from '@/lib/supabaseClient'
import { pullTrabajadoresHistorial } from '@/lib/sync'
import { PageHeader } from '@/components/ui/PageHeader'
import { CardSection, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { TrabajadorHistorial } from '@/types'

type Resultado = {
  validos: TrabajadorHistorial[]
  filasLeidas: number
  legajosInvalidos: number
  columnasFaltantes: CampoTrabajador[]
  faltaColumnaFecha: boolean
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
      if (columnasFaltantes.length > 0 || idxFecha < 0) {
        setResultado({
          validos: [],
          filasLeidas: filas.length - 1,
          legajosInvalidos: 0,
          columnasFaltantes,
          faltaColumnaFecha: idxFecha < 0,
        })
        return
      }

      const idx = (campo: CampoTrabajador) => campoPorColumna.indexOf(campo)
      const idxLegajo = idx('legajo')
      const idxNombre = idx('nombre_completo')
      const idxArea = idx('area')
      const idxFundo = idx('fundo')
      const idxGrupo = idx('grupo')
      const idxSupCuadrilla = idx('sup_cuadrilla')

      // TAREO trae muchas filas por trabajador y por día (una por marcación).
      // Se guarda un registro por Legajo+Día (no uno solo "actual" por legajo),
      // para poder buscar el dato tal como estaba en la fecha del caso. Dentro
      // de un mismo día, se prefiere la fila con Módulo/Fundo lleno sobre una
      // vacía, y entre esas gana la más reciente por hora.
      const mejorPorLegajoYDia = new Map<string, { fila: unknown[]; dia: string; ts: number; tieneFundo: boolean }>()
      let legajosInvalidos = 0

      for (let i = 1; i < filas.length; i++) {
        const fila = filas[i]
        const legajo = String(fila[idxLegajo] ?? '').trim()
        const dia = fechaSoloDia(fila[idxFecha])
        if (!LEGAJO_REGEX.test(legajo) || !dia) {
          legajosInvalidos++
          continue
        }
        const clave = `${legajo}|${dia}`
        const ts = timestampDeCelda(fila[idxFecha])
        const tieneFundo = idxFundo >= 0 ? String(fila[idxFundo] ?? '').trim() !== '' : false
        const actual = mejorPorLegajoYDia.get(clave)
        const esMejor =
          !actual || (tieneFundo && !actual.tieneFundo) || (tieneFundo === actual.tieneFundo && ts >= actual.ts)
        if (esMejor) {
          mejorPorLegajoYDia.set(clave, { fila, dia, ts, tieneFundo })
        }
      }

      const validos: TrabajadorHistorial[] = [...mejorPorLegajoYDia.entries()].map(([clave, { fila, dia }]) => {
        const legajo = clave.split('|')[0]
        return {
          legajo,
          fecha: dia,
          dni: dniDesdeLegajo(legajo),
          nombre_completo: String(fila[idxNombre] ?? '').trim(),
          area: idxArea >= 0 ? String(fila[idxArea] ?? '').trim() || null : null,
          fundo: idxFundo >= 0 ? String(fila[idxFundo] ?? '').trim() || null : null,
          grupo: idxGrupo >= 0 ? String(fila[idxGrupo] ?? '').trim() || null : null,
          sup_cuadrilla: idxSupCuadrilla >= 0 ? String(fila[idxSupCuadrilla] ?? '').trim() || null : null,
          updated_at: new Date().toISOString(),
        }
      })

      setResultado({
        validos,
        filasLeidas: filas.length - 1,
        legajosInvalidos,
        columnasFaltantes: [],
        faltaColumnaFecha: false,
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
    const confirmado = window.confirm(
      'Esto va a borrar TODO el historial de personal anterior y lo reemplaza solo con los datos de este archivo. ¿Continuar?',
    )
    if (!confirmado) return
    setCargando(true)
    setError(null)
    try {
      // Reemplazo total: ya no se conserva historial de cargas anteriores,
      // cada archivo subido sustituye por completo a la tabla.
      const { error: deleteError } = await supabase.from('trabajadores_historial').delete().neq('legajo', '')
      if (deleteError) throw new Error(deleteError.message)

      const lote = 500
      for (let i = 0; i < resultado.validos.length; i += lote) {
        const { error: upsertError } = await supabase
          .from('trabajadores_historial')
          .upsert(resultado.validos.slice(i, i + lote), { onConflict: 'legajo,fecha' })
        if (upsertError) throw new Error(upsertError.message)
      }
      await pullTrabajadoresHistorial()
      setMensaje(`Reemplazado: la tabla ahora tiene solo estos ${resultado.validos.length} registros (legajo + día).`)
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
        title="Importar personal"
        description="Sube el Excel de TAREO (reporte de auditoría móvil). Cada carga reemplaza por completo los datos anteriores: la tabla queda solo con lo que traiga este archivo."
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

        {resultado && resultado.faltaColumnaFecha && (
          <p className="text-sm text-red-600">
            No encontré una columna de fecha (ej. "Fecha Hora Tareo") en el archivo — es obligatoria
            para saber a qué día pertenece cada registro.
          </p>
        )}

        {resultado && resultado.columnasFaltantes.length > 0 && (
          <p className="text-sm text-red-600">
            Al archivo le faltan columnas obligatorias: {resultado.columnasFaltantes.join(', ')}. Revisa los
            encabezados del Excel.
          </p>
        )}

        {resultado && resultado.columnasFaltantes.length === 0 && !resultado.faltaColumnaFecha && (
          <Card className="p-4 space-y-2">
            <p className="text-sm text-neutral-700">Filas leídas: {resultado.filasLeidas}</p>
            <p className="text-sm text-neutral-700">
              Registros (legajo + día) únicos válidos: {resultado.validos.length}
            </p>
            {resultado.legajosInvalidos > 0 && (
              <p className="text-sm text-amber-600">
                Filas descartadas por legajo o fecha inválidos: {resultado.legajosInvalidos}
              </p>
            )}
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              Esto borra todo el historial de personal cargado antes y lo reemplaza solo con estos registros.
            </p>
            <Button onClick={confirmarCarga} loading={cargando} disabled={resultado.validos.length === 0}>
              {cargando ? 'Reemplazando...' : `Reemplazar todo (${resultado.validos.length})`}
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}
