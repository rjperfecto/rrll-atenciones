import type { TipoRegistro } from '@/types'

// "360 Laboral" tiene su propio módulo (Registrar caminata/Compromisos, ver
// src/features/f360): no comparte formulario ni filtros con Registrar/Atenciones.
// Ya no se divide entre GENERAL/COSECHA (ver migración 0025): Registrar
// siempre guarda 'GENERAL', y Cosecha se distingue por el campo Área.
export const TIPOS_REGISTRO_PRINCIPAL: Extract<TipoRegistro, 'GENERAL'>[] = ['GENERAL']
