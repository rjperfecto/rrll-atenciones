import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CalendarDays, CheckCircle2, Loader2 } from 'lucide-react'
import { atencionSchema, type AtencionFormValues } from './atencionSchema'
import { gravedadDe } from '@/data/categorizacion'
import { TIPOS_REGISTRO_PRINCIPAL } from '@/data/tipoRegistro'
import { supRrllPorZona } from '@/data/supervisoresRrll'
import { moduloDesdeFundo } from '@/lib/modulo'
import { dniDesdeLegajo } from '@/data/legajo'
import { buscarAfiliadoPorLegajo } from '@/lib/trabajadoresApi'
import { crearAtencion } from '@/lib/atencionesApi'
import { useAuth } from '@/features/auth/AuthContext'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { CardSection } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import { FormularioGeneral } from './FormularioGeneral'
import type { Atencion } from '@/types'
import type { Zona } from '@/data/zonasFundos'

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

export function AtencionForm() {
  const { profile } = useAuth()
  const [estadoGuardado, setEstadoGuardado] = useState<'idle' | 'guardando' | 'guardado'>('idle')
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null)
  // Fuerza un remount del cuerpo del formulario tras cada envío exitoso:
  // limpia también el estado local propio (búsqueda de legajo, etc.).
  const [formKey, setFormKey] = useState(0)

  // Si el usuario logueado tiene Zona fija (Administración > Personal por
  // zona), el formulario ya arranca con esa zona (el campo queda deshabilitado
  // en FormularioGeneral, ver zonaUsuario ahí).
  const metodos = useForm<AtencionFormValues>({
    resolver: zodResolver(atencionSchema),
    mode: 'onTouched',
    defaultValues: { tipoRegistro: 'COSECHA', fecha: hoy(), zona: (profile?.zona_asignada as Zona | undefined) ?? undefined },
  })

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = metodos

  const valores = watch()
  const { tipoRegistro, fecha } = valores

  function limpiarFormulario() {
    // reset(valoresParciales) no limpia los campos no incluidos (se probó y
    // confirmó en su momento); reset() sin argumentos sí limpia todo.
    reset()
    setValue('fecha', hoy())
    setValue('tipoRegistro', 'COSECHA')
    setFormKey((k) => k + 1)
  }

  async function onSubmit(values: AtencionFormValues) {
    if (!profile) return
    setErrorGuardado(null)
    // Se recalcula acá (no se confía solo en el estado de "Buscar") por si
    // el usuario escribió el legajo y envió el formulario sin buscar antes.
    const gravedadFinal = gravedadDe(values.tipo, values.categoria, values.subcategoria)
    if (!gravedadFinal) return
    setEstadoGuardado('guardando')

    const esAfiliadoFinal = await buscarAfiliadoPorLegajo(values.legajo)
    // La zona fija del usuario logueado (Administración > Personal por
    // zona) gana siempre sobre lo que haya en el formulario.
    const zonaFinal = (profile.zona_asignada as Zona | null) ?? values.zona
    const now = new Date().toISOString()

    const atencion: Atencion = {
      id: crypto.randomUUID(),
      client_uuid: crypto.randomUUID(),
      tipo_registro: values.tipoRegistro,
      fecha: values.fecha,
      fecha_cierre: null,
      zona: zonaFinal,
      fundo: values.fundo || null,
      modulo: values.fundo ? moduloDesdeFundo(values.fundo) : null,
      grupo: values.grupo || null,
      area: values.area || null,
      tipo: values.tipo,
      categoria: values.categoria,
      subcategoria: values.subcategoria,
      falta: null,
      gravedad: gravedadFinal,
      comentarios: values.comentarios || null,
      involucrados: [
        {
          legajo: values.legajo,
          dni: dniDesdeLegajo(values.legajo),
          nombre_completo: values.nombreInvolucrado,
          es_afiliado: esAfiliadoFinal,
        },
      ],
      estado: 'ABIERTO',
      accion_correctiva: null,
      dias_suspension: null,
      detalle_cierre: null,
      sup_cuadrilla: values.supCuadrilla || null,
      responsable_id: profile.id,
      responsable_nombre: profile.nombre_completo,
      sup_rrll: supRrllPorZona(zonaFinal),
      reporte: values.reporte || null,
      antecedente: null,
      notas_seguimiento: null,
      lider_cosecha: null,
      alcance: null,
      tipo_atencion_360: null,
      alertas_360: null,
      detalle_alerta: null,
      compromiso_generado: null,
      detalle_compromiso: null,
      fecha_fin_compromiso: null,
      evidencia_360: null,
      resultado_compromiso: null,
      created_at: now,
      updated_at: now,
    }

    const { error } = await crearAtencion(atencion)
    if (error) {
      setEstadoGuardado('idle')
      setErrorGuardado(`No se pudo guardar: ${error}. Verifica tu conexión e intenta de nuevo.`)
      return
    }
    setEstadoGuardado('guardado')
    limpiarFormulario()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => setEstadoGuardado('idle'), 1500)
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="Registrar" description="Registra un caso de RRLL en campo." />

      <FormProvider {...metodos}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {errorGuardado && (
            <div className="rounded-md bg-red-50 border border-red-200 text-red-800 text-sm px-3 py-2 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              {errorGuardado}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Tipo de registro">
            {TIPOS_REGISTRO_PRINCIPAL.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tipoRegistro === t}
                onClick={() => setValue('tipoRegistro', t)}
                className={cn(
                  'rounded-lg border py-2.5 text-sm font-semibold text-center transition-all duration-200',
                  tipoRegistro === t
                    ? 'bg-brand text-white border-brand shadow-sm'
                    : 'bg-white text-navy border-neutral-200 hover:border-brand/40',
                )}
              >
                {t}
              </button>
            ))}
          </div>
          {errors.tipoRegistro && <p className="text-xs text-danger -mt-2">{String(errors.tipoRegistro.message)}</p>}

          <CardSection title="Fecha" icon={<CalendarDays className="size-4 text-brand" />}>
            <Field label="Fecha del caso" value={fecha} error={errors.fecha?.message}>
              <input type="date" {...register('fecha')} className="input" />
            </Field>
          </CardSection>

          <div key={formKey}>
            <FormularioGeneral />
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span
              className={cn(
                'text-xs font-medium transition-opacity duration-200 text-amber-700',
                isDirty && estadoGuardado === 'idle' ? 'opacity-100' : 'opacity-0',
              )}
            >
              ● Cambios sin guardar
            </span>
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <Button type="button" variant="secondary" onClick={limpiarFormulario} disabled={isSubmitting}>
                Limpiar formulario
              </Button>
              <Button type="submit" loading={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Registrar atención'}
              </Button>
            </div>
          </div>
        </form>
      </FormProvider>

      {estadoGuardado !== 'idle' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center gap-3 max-w-xs w-full">
            {estadoGuardado === 'guardando' ? (
              <>
                <Loader2 className="size-10 text-brand animate-spin" />
                <p className="text-sm font-medium text-neutral-700">Guardando...</p>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-10 text-success" />
                <p className="text-sm font-medium text-neutral-800">Atención registrada</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
