import { z } from 'zod'
import { ZONAS } from '@/data/zonasFundos'
import { PACKING_FUNDOS, TURNOS_360 } from '@/data/formulario360'

export const alertaReportadaSchema = z.object({
  categoria: z.string().min(1),
  subcategoria: z.string().min(1),
  nivel: z.enum(['ALTO', 'MEDIO', 'BAJO']),
  cantidad: z.number().int().min(1, 'La cantidad debe ser al menos 1'),
  detalle: z.string().min(1, 'El detalle es obligatorio'),
  accion: z.string().min(1, 'La acción es obligatoria'),
})

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
    liderCosecha: z.string().min(1, 'El líder de cosecha es obligatorio'),
    // Se busca por número de grupo (no por legajo del supervisor): un
    // trabajador cualquiera de ese grupo trae el mismo líder/fundo (ver
    // buscarTrabajadorPorGrupo en RegistrarCaminata).
    grupo: z.string().min(1, 'El grupo es obligatorio'),
    totalEncuestado: z.union([z.number(), z.nan()]).optional(),
    actividad: z.string().min(1, 'La actividad es obligatoria'),
    tipoAtencion360: z.array(z.string()).min(1, 'Selecciona al menos un tipo de atención'),
    otroTipoAtencion: z.string().optional(),
    alertasReportadas: z.array(alertaReportadaSchema).min(1, 'Agrega al menos una alerta'),
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

    if (valores.totalEncuestado === undefined || Number.isNaN(valores.totalEncuestado)) {
      ctx.addIssue({ code: 'custom', message: 'El total de personal encuestado es obligatorio', path: ['totalEncuestado'] })
    }

    if (valores.tipoAtencion360.includes('OTRAS') && !valores.otroTipoAtencion) {
      ctx.addIssue({ code: 'custom', message: 'Especifica el otro tipo de atención', path: ['otroTipoAtencion'] })
    }
  })

export type Atencion360FormValues = z.infer<typeof atencion360Schema>
