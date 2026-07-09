import { z } from 'zod'
import { TIPOS } from '@/data/categorizacion'
import { ZONAS } from '@/data/zonasFundos'

export const atencionSchema = z.object({
  fecha: z.string().min(1, 'La fecha es obligatoria'),
  zona: z.enum(ZONAS, { message: 'Selecciona una zona' }),
  fundo: z.string().optional(),
  grupo: z.string().optional(),
  tipo: z.enum(TIPOS, { message: 'Selecciona un tipo' }),
  categoria: z.string().min(1, 'Selecciona una categoría'),
  subcategoria: z.string().min(1, 'Selecciona una subcategoría'),
  dni: z
    .string()
    .regex(/^\d{8}$/, 'El DNI debe tener 8 dígitos')
    .optional()
    .or(z.literal('')),
  nombreInvolucrado: z.string().min(1, 'El nombre del trabajador es obligatorio'),
  cantidadInvolucrados: z.number().int().min(1),
  esAfiliado: z.enum(['SI', 'NO', 'NO_ESPECIFICA']),
  comentarios: z.string().optional(),
})

export type AtencionFormValues = z.infer<typeof atencionSchema>
