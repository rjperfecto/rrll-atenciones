import { z } from 'zod'
import { ACCIONES_CORRECTIVAS } from '@/data/accionCorrectiva'

export const cierreSchema = z
  .object({
    accionCorrectiva: z.enum(ACCIONES_CORRECTIVAS, { message: 'Selecciona la acción correctiva' }),
    diasSuspension: z.number().int().min(1).optional(),
    detalleCierre: z.string().optional(),
  })
  .refine((data) => data.accionCorrectiva !== 'SUSPENSIÓN' || Boolean(data.diasSuspension), {
    message: 'Indica los días de suspensión',
    path: ['diasSuspension'],
  })

export type CierreFormValues = z.infer<typeof cierreSchema>
