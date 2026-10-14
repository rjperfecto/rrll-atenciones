import { z } from 'zod'
import { TIPOS } from '@/data/categorizacion'
import { ZONAS } from '@/data/zonasFundos'
import { LEGAJO_REGEX } from '@/data/legajo'
import { ACCIONES_CORRECTIVAS } from '@/data/accionCorrectiva'

// GENERAL y COSECHA comparten el mismo formulario (Tipo → Categoría →
// Subcategoría → Gravedad, trabajador involucrado por legajo). "360
// Laboral" tiene su propio módulo y schema aparte (ver
// atencion360Schema.ts, usado por src/features/f360/RegistrarCaminata.tsx).
//
// El cierre (acción correctiva, días de suspensión, detalle) ya no es un
// paso aparte (antes "Cerrar caso", ver CerrarCasoModal.tsx, quedaba para
// después): se registra obligatorio en el mismo formulario, así que el caso
// nace CERRADO directamente — ver AtencionForm.tsx onSubmit.
export const atencionSchema = z
  .object({
    tipoRegistro: z.enum(['GENERAL', 'COSECHA']),
    fecha: z.string().min(1, 'La fecha es obligatoria'),
    zona: z.enum(ZONAS, { message: 'Selecciona una zona' }),
    fundo: z.string().optional(),
    grupo: z.string().optional(),
    area: z.string().optional(),
    tipo: z.enum(TIPOS, { message: 'Selecciona un tipo' }),
    categoria: z.string().min(1, 'Selecciona una categoría'),
    subcategoria: z.string().min(1, 'Selecciona una subcategoría'),
    legajo: z.string().regex(LEGAJO_REGEX, 'El legajo debe empezar con "10" seguido del DNI (8 dígitos)'),
    nombreInvolucrado: z.string().min(1, 'El nombre del trabajador es obligatorio'),
    supCuadrilla: z.string().optional(),
    reporte: z.string().optional(),
    comentarios: z.string().optional(),
    accionCorrectiva: z.enum(ACCIONES_CORRECTIVAS, { message: 'Selecciona la acción correctiva' }),
    diasSuspension: z.number().int().min(1).optional(),
    detalleCierre: z.string().optional(),
  })
  .refine((data) => data.accionCorrectiva !== 'SUSPENSIÓN' || Boolean(data.diasSuspension), {
    message: 'Indica los días de suspensión',
    path: ['diasSuspension'],
  })

export type AtencionFormValues = z.infer<typeof atencionSchema>
