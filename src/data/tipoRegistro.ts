import type { TipoRegistro } from '@/types'

// "360 Laboral" tiene su propio módulo (Registrar caminata/Compromisos, ver
// src/features/f360): no comparte formulario ni filtros con Registrar/Atenciones.
export const TIPOS_REGISTRO_PRINCIPAL: Extract<TipoRegistro, 'GENERAL' | 'COSECHA'>[] = ['COSECHA', 'GENERAL']
