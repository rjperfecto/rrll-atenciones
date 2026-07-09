import { z } from 'zod'
import { TIPOS } from '@/data/categorizacion'
import { ZONAS } from '@/data/zonasFundos'
import { AREAS } from '@/data/areas'
import { ACCIONES_CORRECTIVAS } from '@/data/accionCorrectiva'

export const atencionSchema = z
  .object({
    fecha: z.string().min(1, 'La fecha es obligatoria'),
    zona: z.enum(ZONAS, { message: 'Selecciona una zona' }),
    fundo: z.string().optional(),
    modulo: z.string().optional(),
    grupo: z.string().optional(),
    area: z.enum(AREAS).optional().or(z.literal('')),
    tipo: z.enum(TIPOS, { message: 'Selecciona un tipo' }),
    categoria: z.string().min(1, 'Selecciona una categoría'),
    subcategoria: z.string().min(1, 'Selecciona una subcategoría'),
    falta: z.string().optional(),
    dni: z
      .string()
      .regex(/^\d{8}$/, 'El DNI debe tener 8 dígitos')
      .optional()
      .or(z.literal('')),
    legajo: z.string().optional(),
    nombreInvolucrado: z.string().min(1, 'El nombre del trabajador es obligatorio'),
    cantidadInvolucrados: z.number().int().min(1),
    esAfiliado: z.enum(['SI', 'NO', 'NO_ESPECIFICA']),
    supCuadrilla: z.string().optional(),
    supRrll: z.string().optional(),
    accionCorrectiva: z.enum(ACCIONES_CORRECTIVAS).optional().or(z.literal('')),
    diasSuspension: z.number().int().min(1).optional(),
    reporte: z.string().optional(),
    antecedente: z.string().optional(),
    notasSeguimiento: z.string().optional(),
    comentarios: z.string().optional(),
  })
  .refine((data) => data.accionCorrectiva !== 'SUSPENSIÓN' || Boolean(data.diasSuspension), {
    message: 'Indica los días de suspensión',
    path: ['diasSuspension'],
  })

export type AtencionFormValues = z.infer<typeof atencionSchema>
