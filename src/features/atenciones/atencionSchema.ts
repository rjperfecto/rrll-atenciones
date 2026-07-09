import { z } from 'zod'
import { TIPOS } from '@/data/categorizacion'
import { ZONAS } from '@/data/zonasFundos'
import { AREAS } from '@/data/areas'
import { LEGAJO_REGEX } from '@/data/legajo'

export const atencionSchema = z.object({
  fecha: z.string().min(1, 'La fecha es obligatoria'),
  zona: z.enum(ZONAS, { message: 'Selecciona una zona' }),
  fundo: z.string().optional(),
  grupo: z.string().optional(),
  area: z.enum(AREAS).optional().or(z.literal('')),
  tipo: z.enum(TIPOS, { message: 'Selecciona un tipo' }),
  categoria: z.string().min(1, 'Selecciona una categoría'),
  subcategoria: z.string().min(1, 'Selecciona una subcategoría'),
  falta: z.string().optional(),
  legajo: z.string().regex(LEGAJO_REGEX, 'El legajo debe empezar con "10" seguido del DNI (8 dígitos)'),
  nombreInvolucrado: z.string().min(1, 'El nombre del trabajador es obligatorio'),
  esAfiliado: z.enum(['SI', 'NO', 'NO_ESPECIFICA']),
  supCuadrilla: z.string().optional(),
  reporte: z.string().optional(),
  antecedente: z.string().optional(),
  notasSeguimiento: z.string().optional(),
  comentarios: z.string().optional(),
})

export type AtencionFormValues = z.infer<typeof atencionSchema>
