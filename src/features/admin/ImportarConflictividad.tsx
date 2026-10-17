import { useState } from 'react'
import { AlertCircle, CheckCircle2, Upload } from 'lucide-react'
import { leerFilasXlsx } from './leerXlsx'
import { reemplazarConflictividad, type NivelConflictividad } from '@/lib/conflictividadApi'
import { PageHeader } from '@/components/ui/PageHeader'
import { CardSection, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

type Resultado = {
  validas: { grupo: string; valor: number; nivel: NivelConflictividad }[]
  filasLeidas: number
  invalidas: number
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toUpperCase()
}

// Acepta "1.5" y "1,5" (el Excel suele traer coma decimal).
function parseNumero(valor: unknown): number | null {
  const texto = String(valor ?? '').trim().replace(',', '.')
  if (!texto) return null
  const numero = Number(texto)
  return Number.isFinite(numero) ? numero : null
}

// Rangos pedidos: 1.1-1.49 BAJO, 1.5-2.29 MEDIO, 2.3-3 ALTO. Lo que quede
// debajo de 1.1 (ej. exactamente 1) se trata como BAJO, no se deja sin
// clasificar.
function nivelDeConflictividad(valor: number): NivelConflictividad {
  if (valor <= 1.49) return 'BAJO'
  if (valor <= 2.29) return 'MEDIO'
  return 'ALTO'
}

// Importar conflictividad (ver migración 0031): Excel de 2 columnas
// (grupo_cosecha, CONFLICTIVIDAD) que alimenta el tablero de 360 Laboral >
// Próximas caminatas. Reemplaza todo en cada carga, igual que Importar personal.
export function ImportarConflictividad() {
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

      const encabezados = filas[0].map((c) => normalizar(String(c ?? '')))
      const idxGrupo = encabezados.findIndex((h) => h === 'GRUPO_COSECHA' || h === 'GRUPO COSECHA')
      const idxConflictividad = encabezados.findIndex((h) => h === 'CONFLICTIVIDAD')
      if (idxGrupo < 0 || idxConflictividad < 0) {
        throw new Error('El archivo debe tener las columnas "grupo_cosecha" y "CONFLICTIVIDAD".')
      }

      const porGrupo = new Map<string, { grupo: string; valor: number; nivel: NivelConflictividad }>()
      let invalidas = 0
      for (let i = 1; i < filas.length; i++) {
        const grupo = String(filas[i][idxGrupo] ?? '').trim().toUpperCase()
        const valor = parseNumero(filas[i][idxConflictividad])
        if (!grupo || valor === null) {
          invalidas++
          continue
        }
        porGrupo.set(grupo, { grupo, valor, nivel: nivelDeConflictividad(valor) })
      }

      setResultado({ validas: [...porGrupo.values()], filasLeidas: filas.length - 1, invalidas })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo leer el archivo.')
    } finally {
      setProcesando(false)
      e.target.value = ''
    }
  }

  async function confirmarCarga() {
    if (!resultado || resultado.validas.length === 0) return
    const confirmado = window.confirm(
      'Esto borra la conflictividad cargada antes y la reemplaza solo con los datos de este archivo. ¿Continuar?',
    )
    if (!confirmado) return
    setCargando(true)
    setError(null)
    const { error: err } = await reemplazarConflictividad(resultado.validas)
    setCargando(false)
    if (err) {
      setError(`No se pudo subir a la base de datos: ${err}`)
      return
    }
    setMensaje(`Reemplazado: ${resultado.validas.length} grupos con conflictividad cargada.`)
    setResultado(null)
  }

  return (
    <div className="max-w-xl">
      <PageHeader
        title="Importar conflictividad"
        description='Sube el Excel con "grupo_cosecha" y "CONFLICTIVIDAD" (de 1 a 3). Se usa en 360 Laboral > Próximas caminatas para priorizar qué grupos visitar primero.'
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

        {resultado && (
          <Card className="p-4 space-y-2">
            <p className="text-sm text-neutral-700">Filas leídas: {resultado.filasLeidas}</p>
            <p className="text-sm text-neutral-700">Grupos válidos: {resultado.validas.length}</p>
            {resultado.invalidas > 0 && (
              <p className="text-sm text-amber-600">Filas descartadas (grupo o conflictividad inválidos): {resultado.invalidas}</p>
            )}
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              Esto borra la conflictividad cargada antes y la reemplaza solo con estos grupos.
            </p>
            <Button onClick={confirmarCarga} loading={cargando} disabled={resultado.validas.length === 0}>
              {cargando ? 'Reemplazando...' : `Reemplazar todo (${resultado.validas.length})`}
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}
