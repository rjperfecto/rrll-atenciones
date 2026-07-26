import type { TipoRegistro } from '@/types'

// Por ahora las 3 secciones comparten los mismos campos del formulario; a
// futuro cada una tendrá columnas propias (ver migración 0012).
export const TIPOS_REGISTRO: TipoRegistro[] = ['GENERAL', 'COSECHA', '360 LABORAL']
