// Mapeo tolerante de encabezados del Excel de personal (hoy: export de TAREO,
// "reporte_auditoria_movil") a los campos de la tabla `trabajadores_historial`.
// Normaliza (mayúsculas, sin tildes, sin espacios extra) antes de comparar,
// para aceptar variantes razonables de nombre de columna.

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita marcas diacríticas (tildes) tras NFD
    .trim()
    .toUpperCase()
}

// OJO: en el export de TAREO la columna "Modulo" en realidad trae el código
// completo de fundo+lote (ej. "REM 2-X"), que es lo que esta app llama FUNDO.
const SINONIMOS: Record<string, string> = {
  LEGAJO: 'legajo',
  NOMBRE: 'nombre_completo',
  NOMBRES: 'nombre_completo',
  'NOMBRE COMPLETO': 'nombre_completo',
  INVOLUCRADO: 'nombre_completo',
  AREA: 'area',
  ACTIVIDAD: 'area',
  FUNDO: 'fundo',
  MODULO: 'fundo',
  GRUPO: 'grupo',
  SUPERVISOR: 'sup_cuadrilla',
  'SUP. CUADRILLA': 'sup_cuadrilla',
  'SUP CUADRILLA': 'sup_cuadrilla',
  'SUPERVISOR CUADRILLA': 'sup_cuadrilla',
  'SUPERVISOR DE CUADRILLA': 'sup_cuadrilla',
}

// Columna usada solo para saber qué fila es la más reciente por legajo
// (TAREO trae muchas filas por trabajador, una por marcación/actividad).
const SINONIMOS_FECHA = ['FECHA HORA TAREO', 'FECHA Y HORA TAREO', 'FECHA TAREO', 'FECHA']

export type CampoTrabajador = 'legajo' | 'nombre_completo' | 'area' | 'fundo' | 'grupo' | 'sup_cuadrilla'

export function mapearEncabezados(encabezados: string[]): (CampoTrabajador | null)[] {
  return encabezados.map((h) => (SINONIMOS[normalizar(h)] as CampoTrabajador | undefined) ?? null)
}

export function indiceColumnaFecha(encabezados: string[]): number {
  return encabezados.findIndex((h) => SINONIMOS_FECHA.includes(normalizar(h)))
}
