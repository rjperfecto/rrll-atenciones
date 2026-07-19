// Mapeo tolerante de encabezados del Excel AFILIADOS a los campos de la
// tabla `afiliados`. Misma normalización (mayúsculas, sin tildes) que
// personalColumnas.ts, para aceptar variantes razonables de columna.

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toUpperCase()
}

const SINONIMOS: Record<string, string> = {
  LEGAJO: 'legajo',
  'APELLIDOS Y NOMBRES': 'nombre_completo',
  NOMBRES: 'nombre_completo',
  NOMBRE: 'nombre_completo',
  'NOMBRE COMPLETO': 'nombre_completo',
  CONTINGENCIA: 'contingencia',
  ESTADO: 'contingencia',
}

// Valores de CONTINGENCIA que representan afiliación vigente; cualquier otro
// valor (EXAFILIADO, DESAFILIADO, etc.) se considera no afiliado.
const VALORES_AFILIADO = ['AFILIADO']

export type CampoAfiliado = 'legajo' | 'nombre_completo' | 'contingencia'

export function mapearEncabezadosAfiliados(encabezados: string[]): (CampoAfiliado | null)[] {
  return encabezados.map((h) => (SINONIMOS[normalizar(h)] as CampoAfiliado | undefined) ?? null)
}

export function esContingenciaAfiliado(valor: string): boolean {
  return VALORES_AFILIADO.includes(normalizar(valor))
}
