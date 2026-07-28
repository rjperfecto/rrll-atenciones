import { z } from 'zod'
import { ZONAS } from '@/data/zonasFundos'
import { SEDES_360, PACKING_SEDES, TURNOS_360, FUNDOS_POR_ZONA_360 } from '@/data/formulario360'

// "360 Laboral" es un registro de sesión/grupo (conversatorio/seguimiento/
// compromiso), no de un trabajador individual — por eso es un schema aparte
// de atencionSchema.ts en vez de una variación con más campos opcionales.
// La ramificación replica el formulario de Microsoft Forms usado en campo:
// Sede (Packing -> Packing/Turno; Fundo -> Líder de Cosecha/Grupo/Alcance/
// Zona/Fundo de zona/Módulo) y Compromiso (sí -> Detalle + Fecha fin).

export const atencion360Schema = z
  .object({
    tipoRegistro: z.literal('360 LABORAL'),
    fecha: z.string().min(1, 'La fecha es obligatoria'),
    nivelConflictividad: z.enum(['BAJO', 'MEDIO', 'ALTO'], { message: 'Selecciona el nivel de conflictividad' }),
    sede: z.enum(SEDES_360, { message: 'Selecciona la sede' }),
    packingSede: z.enum(PACKING_SEDES).optional().or(z.literal('')),
    turno: z.enum(TURNOS_360).optional().or(z.literal('')),
    liderCosecha: z.string().optional(),
    grupo: z.string().optional(),
    alcance: z.union([z.number(), z.nan()]).optional(),
    zona: z.enum(ZONAS).optional().or(z.literal('')),
    fundo: z.string().optional(),
    modulo: z.string().optional(),
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
    if (valores.sede === 'PACKING') {
      if (!valores.packingSede) {
        ctx.addIssue({ code: 'custom', message: 'Selecciona el packing', path: ['packingSede'] })
      }
      if (!valores.turno) {
        ctx.addIssue({ code: 'custom', message: 'Selecciona el turno', path: ['turno'] })
      }
    }

    if (valores.sede === 'FUNDO') {
      if (!valores.liderCosecha) {
        ctx.addIssue({ code: 'custom', message: 'El líder de cosecha es obligatorio', path: ['liderCosecha'] })
      }
      if (!valores.grupo) {
        ctx.addIssue({ code: 'custom', message: 'El grupo es obligatorio', path: ['grupo'] })
      }
      if (valores.alcance === undefined || Number.isNaN(valores.alcance)) {
        ctx.addIssue({ code: 'custom', message: 'El alcance es obligatorio', path: ['alcance'] })
      }
      if (!valores.zona) {
        ctx.addIssue({ code: 'custom', message: 'Selecciona la zona', path: ['zona'] })
      }
      if (valores.zona && FUNDOS_POR_ZONA_360[valores.zona] && !valores.fundo) {
        ctx.addIssue({ code: 'custom', message: 'Selecciona el fundo', path: ['fundo'] })
      }
      if (!valores.modulo) {
        ctx.addIssue({ code: 'custom', message: 'El módulo es obligatorio', path: ['modulo'] })
      }
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
