import { z } from 'zod'
import { ZONAS } from '@/data/zonasFundos'
import { LEGAJO_REGEX } from '@/data/legajo'
import { PACKING_FUNDOS, TURNOS_360 } from '@/data/formulario360'

// "360 Laboral" es un registro de sesión/grupo (conversatorio/seguimiento/
// compromiso), no de un trabajador individual — por eso es un schema aparte
// del de Registrar/Atenciones. Zona/Fundo/Módulo se capturan exactamente
// igual que en Atenciones, salvo cuando Zona=PACKING (Fundo y Módulo pasan
// a ser listas cerradas: el módulo ahí representa el turno).
export const atencion360Schema = z
  .object({
    tipoRegistro: z.literal('360 LABORAL'),
    fecha: z.string().min(1, 'La fecha es obligatoria'),
    nivelConflictividad: z.enum(['BAJO', 'MEDIO', 'ALTO'], { message: 'Selecciona el nivel de conflictividad' }),
    zona: z.enum(ZONAS, { message: 'Selecciona una zona' }),
    fundo: z.string().min(1, 'El fundo es obligatorio'),
    modulo: z.string().optional(),
    legajoSupervisor: z.string().regex(LEGAJO_REGEX, 'El legajo debe empezar con "10" seguido del DNI (8 dígitos)'),
    liderCosecha: z.string().min(1, 'El líder de cosecha es obligatorio'),
    grupo: z.string().min(1, 'El grupo es obligatorio'),
    alcance: z.union([z.number(), z.nan()]).optional(),
    actividad: z.string().min(1, 'La actividad es obligatoria'),
    tipoAtencion360: z.array(z.string()).min(1, 'Selecciona al menos un tipo de atención'),
    otroTipoAtencion: z.string().optional(),
    alertas360: z.array(z.string()).min(1, 'Selecciona al menos una alerta'),
    otraAlerta: z.string().optional(),
    detalleAlerta: z.string().min(1, 'El detalle de la alerta es obligatorio'),
    compromisoGenerado: z.enum(['SI', 'NO'], { message: 'Indica si se generó un compromiso' }),
    detalleCompromiso: z.string().optional(),
    fechaFinCompromiso: z.string().optional(),
    evidencia360: z.string().min(1, 'La evidencia es obligatoria'),
    observaciones: z.string().min(1, 'Las observaciones son obligatorias'),
  })
  .superRefine((valores, ctx) => {
    if (valores.zona === 'PACKING') {
      if (!PACKING_FUNDOS.includes(valores.fundo as never)) {
        ctx.addIssue({ code: 'custom', message: 'Selecciona Packing Salaverry o Packing Chao', path: ['fundo'] })
      }
      if (!TURNOS_360.includes(valores.modulo as never)) {
        ctx.addIssue({ code: 'custom', message: 'Selecciona el turno', path: ['modulo'] })
      }
    }

    if (valores.alcance === undefined || Number.isNaN(valores.alcance)) {
      ctx.addIssue({ code: 'custom', message: 'El alcance es obligatorio', path: ['alcance'] })
    }

    if (valores.tipoAtencion360.includes('OTRAS') && !valores.otroTipoAtencion) {
      ctx.addIssue({ code: 'custom', message: 'Especifica el otro tipo de atención', path: ['otroTipoAtencion'] })
    }
    if (valores.alertas360.includes('OTRAS') && !valores.otraAlerta) {
      ctx.addIssue({ code: 'custom', message: 'Especifica la otra alerta', path: ['otraAlerta'] })
    }

    if (valores.compromisoGenerado === 'SI') {
      if (!valores.detalleCompromiso) {
        ctx.addIssue({ code: 'custom', message: 'El detalle del compromiso es obligatorio', path: ['detalleCompromiso'] })
      }
      if (!valores.fechaFinCompromiso) {
        ctx.addIssue({ code: 'custom', message: 'La fecha fin de compromiso es obligatoria', path: ['fechaFinCompromiso'] })
      }
    }
  })

export type Atencion360FormValues = z.infer<typeof atencion360Schema>
