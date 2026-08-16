import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { editarAtencion } from '@/lib/atencionesApi'
import { TIPOS, categoriasPorTipo, subcategoriasPorCategoria, gravedadDe, type Tipo } from '@/data/categorizacion'
import { ZONAS } from '@/data/zonasFundos'
import { PACKING_FUNDOS, TURNOS_360, TIPOS_ATENCION_360, ALERTAS_360 } from '@/data/formulario360'
import { moduloDesdeFundo } from '@/lib/modulo'
import { dniDesdeLegajo, LEGAJO_REGEX } from '@/data/legajo'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import type { Atencion } from '@/types'

// Separa la lista guardada (catálogo + a lo más 1 valor libre "OTRAS: ...",
// mismo patrón que arma RegistrarCaminata al guardar) para poder editarla
// con el mismo checkbox-group + campo "Especifica" del formulario original.
function separarCatalogoYLibre(valores: string[] | null, catalogo: readonly string[]) {
  const lista = valores ?? []
  const delCatalogo = lista.filter((v) => (catalogo as readonly string[]).includes(v))
  const libre = lista.find((v) => !(catalogo as readonly string[]).includes(v)) ?? ''
  return { delCatalogo, libre }
}

function CheckboxGroup({ opciones, valores, onToggle }: { opciones: readonly string[]; valores: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="space-y-2">
      {opciones.map((op) => (
        <label key={op} className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
          <input type="checkbox" checked={valores.includes(op)} onChange={() => onToggle(op)} className="size-4 rounded border-neutral-300 text-brand focus:ring-brand/30" />
          {op}
        </label>
      ))}
    </div>
  )
}

export function EditarAtencionModal({ atencion, onClose }: { atencion: Atencion; onClose: () => void }) {
  return atencion.tipo_registro === '360 LABORAL' ? (
    <Editar360Laboral atencion={atencion} onClose={onClose} />
  ) : (
    <EditarGeneral atencion={atencion} onClose={onClose} />
  )
}

function EditarGeneral({ atencion, onClose }: { atencion: Atencion; onClose: () => void }) {
  const involucrado = atencion.involucrados[0]
  const [nombre, setNombre] = useState(involucrado?.nombre_completo ?? '')
  const [legajo, setLegajo] = useState(involucrado?.legajo ?? '')
  const [zona, setZona] = useState(atencion.zona)
  const [fundo, setFundo] = useState(atencion.fundo ?? '')
  const [grupo, setGrupo] = useState(atencion.grupo ?? '')
  const [area, setArea] = useState(atencion.area ?? '')
  const [liderCosecha, setLiderCosecha] = useState(atencion.sup_cuadrilla ?? '')
  const [tipo, setTipo] = useState<Tipo | ''>(atencion.tipo ?? '')
  const [categoria, setCategoria] = useState(atencion.categoria ?? '')
  const [subcategoria, setSubcategoria] = useState(atencion.subcategoria ?? '')
  const [falta, setFalta] = useState(atencion.falta ?? '')
  const [reporte, setReporte] = useState(atencion.reporte ?? '')
  const [antecedente, setAntecedente] = useState(atencion.antecedente ?? '')
  const [comentarios, setComentarios] = useState(atencion.comentarios ?? '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categorias = tipo ? categoriasPorTipo(tipo) : []
  const subcategorias = tipo && categoria ? subcategoriasPorCategoria(tipo, categoria) : []
  const legajoInvalido = legajo.trim() !== '' && !LEGAJO_REGEX.test(legajo.trim())

  async function guardar() {
    setError(null)
    if (!tipo || !categoria || !subcategoria) {
      setError('Selecciona tipo, categoría y subcategoría.')
      return
    }
    const gravedadFinal = gravedadDe(tipo, categoria, subcategoria)
    if (!gravedadFinal) {
      setError('Esa combinación de tipo/categoría/subcategoría no existe en el catálogo.')
      return
    }
    if (legajoInvalido) {
      setError('El legajo debe empezar con "10" seguido del DNI (8 dígitos).')
      return
    }
    setGuardando(true)
    const legajoLimpio = legajo.trim()
    const { error: err } = await editarAtencion(atencion.id, {
      zona,
      fundo: fundo || null,
      modulo: fundo ? moduloDesdeFundo(fundo) : null,
      grupo: grupo || null,
      area: area || null,
      tipo,
      categoria,
      subcategoria,
      gravedad: gravedadFinal,
      falta: falta || null,
      sup_cuadrilla: liderCosecha || null,
      reporte: reporte || null,
      antecedente: antecedente || null,
      comentarios: comentarios || null,
      involucrados: [
        {
          ...involucrado,
          nombre_completo: nombre.toUpperCase(),
          legajo: legajoLimpio,
          dni: legajoLimpio ? dniDesdeLegajo(legajoLimpio) : (involucrado?.dni ?? ''),
        },
      ],
      updated_at: new Date().toISOString(),
    })
    setGuardando(false)
    if (err) {
      setError(`No se pudo guardar: ${err}`)
      return
    }
    onClose()
  }

  return (
    <Modal title="Editar atención" description={`${atencion.fecha} · ${atencion.zona}`} onClose={onClose} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre completo" value={nombre}>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value.toUpperCase())} className="input" />
          </Field>
          <Field label="Legajo" value={legajo} error={legajoInvalido ? 'Debe ser "10" + 8 dígitos de DNI' : undefined}>
            <input type="text" inputMode="numeric" maxLength={10} value={legajo} onChange={(e) => setLegajo(e.target.value)} className="input" />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Zona" value={zona}>
            <select value={zona} onChange={(e) => setZona(e.target.value)} className="input">
              {ZONAS.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fundo" value={fundo}>
            <input type="text" value={fundo} onChange={(e) => setFundo(e.target.value.toUpperCase())} className="input" />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Grupo / cuadrilla" value={grupo}>
            <input type="text" value={grupo} onChange={(e) => setGrupo(e.target.value.toUpperCase())} className="input" />
          </Field>
          <Field label="Área" value={area}>
            <input type="text" value={area} onChange={(e) => setArea(e.target.value.toUpperCase())} className="input" />
          </Field>
        </div>

        <Field label="Líder de Cosecha" value={liderCosecha}>
          <input type="text" value={liderCosecha} onChange={(e) => setLiderCosecha(e.target.value.toUpperCase())} className="input" />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Tipo" value={tipo}>
            <select
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value as Tipo)
                setCategoria('')
                setSubcategoria('')
              }}
              className="input"
            >
              <option value="">Selecciona...</option>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Categoría" value={categoria}>
            <select
              value={categoria}
              disabled={!tipo}
              onChange={(e) => {
                setCategoria(e.target.value)
                setSubcategoria('')
              }}
              className="input"
            >
              <option value="">Selecciona...</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Subcategoría" value={subcategoria}>
            <select value={subcategoria} disabled={!categoria} onChange={(e) => setSubcategoria(e.target.value)} className="input">
              <option value="">Selecciona...</option>
              {subcategorias.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Falta (opcional, si difiere de la subcategoría)" value={falta}>
          <input type="text" value={falta} onChange={(e) => setFalta(e.target.value.toUpperCase())} className="input" />
        </Field>

        <Field label="Reporta" value={reporte}>
          <input type="text" value={reporte} onChange={(e) => setReporte(e.target.value.toUpperCase())} className="input" />
        </Field>
        <Field label="Antecedente" value={antecedente}>
          <input type="text" value={antecedente} onChange={(e) => setAntecedente(e.target.value.toUpperCase())} className="input" />
        </Field>
        <Field label="Comentarios" value={comentarios}>
          <textarea rows={3} value={comentarios} onChange={(e) => setComentarios(e.target.value.toUpperCase())} className="input" />
        </Field>

        {error && (
          <p className="text-sm text-danger flex items-center gap-1.5">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={guardar} loading={guardando}>
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function Editar360Laboral({ atencion, onClose }: { atencion: Atencion; onClose: () => void }) {
  const [zona, setZona] = useState(atencion.zona)
  const esPacking = zona === 'PACKING'
  const [fundo, setFundo] = useState(atencion.fundo ?? '')
  const [turno, setTurno] = useState(esPacking ? (atencion.modulo ?? '') : '')
  const [liderCosecha, setLiderCosecha] = useState(atencion.lider_cosecha ?? '')
  const [grupo, setGrupo] = useState(atencion.grupo ?? '')
  const [alcance, setAlcance] = useState(atencion.alcance ?? 0)
  const [actividad, setActividad] = useState(atencion.area ?? '')

  const tipoInicial = separarCatalogoYLibre(atencion.tipo_atencion_360, TIPOS_ATENCION_360)
  const [tipoAtencion, setTipoAtencion] = useState<string[]>(tipoInicial.delCatalogo)
  const [otroTipoAtencion, setOtroTipoAtencion] = useState(tipoInicial.libre)

  const alertaInicial = separarCatalogoYLibre(atencion.alertas_360, ALERTAS_360)
  const [alertas, setAlertas] = useState<string[]>(alertaInicial.delCatalogo)
  const [otraAlerta, setOtraAlerta] = useState(alertaInicial.libre)

  const [detalleAlerta, setDetalleAlerta] = useState(atencion.detalle_alerta ?? '')
  const [observaciones, setObservaciones] = useState(atencion.comentarios ?? '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(lista: string[], set: (v: string[]) => void, valor: string) {
    set(lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor])
  }

  async function guardar() {
    setError(null)
    setGuardando(true)
    const tipoFinal = [...tipoAtencion, ...(otroTipoAtencion.trim() ? [otroTipoAtencion.trim()] : [])]
    const alertasFinal = [...alertas, ...(otraAlerta.trim() ? [otraAlerta.trim()] : [])]
    const { error: err } = await editarAtencion(atencion.id, {
      zona,
      fundo: esPacking ? fundo || null : fundo || null,
      modulo: esPacking ? turno || null : fundo ? moduloDesdeFundo(fundo) : null,
      lider_cosecha: liderCosecha || null,
      grupo: grupo || null,
      alcance,
      area: actividad || null,
      tipo_atencion_360: tipoFinal,
      alertas_360: alertasFinal,
      detalle_alerta: detalleAlerta || null,
      comentarios: observaciones || null,
      updated_at: new Date().toISOString(),
    })
    setGuardando(false)
    if (err) {
      setError(`No se pudo guardar: ${err}`)
      return
    }
    onClose()
  }

  return (
    <Modal title="Editar caminata 360 Laboral" description={`${atencion.fecha} · ${atencion.zona}`} onClose={onClose} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Zona" value={zona}>
            <select
              value={zona}
              onChange={(e) => {
                setZona(e.target.value)
                setFundo('')
                setTurno('')
              }}
              className="input"
            >
              {ZONAS.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </Field>
          {esPacking ? (
            <Field label="Fundo" value={fundo}>
              <select value={fundo} onChange={(e) => setFundo(e.target.value)} className="input">
                <option value="">Selecciona...</option>
                {PACKING_FUNDOS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <Field label="Fundo" value={fundo}>
              <input type="text" value={fundo} onChange={(e) => setFundo(e.target.value.toUpperCase())} className="input" />
            </Field>
          )}
        </div>

        {esPacking && (
          <Field label="Turno" value={turno}>
            <select value={turno} onChange={(e) => setTurno(e.target.value)} className="input">
              <option value="">Selecciona...</option>
              {TURNOS_360.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Líder de cosecha" value={liderCosecha}>
            <input type="text" value={liderCosecha} onChange={(e) => setLiderCosecha(e.target.value.toUpperCase())} className="input" />
          </Field>
          <Field label="Grupo" value={grupo}>
            <input type="text" value={grupo} onChange={(e) => setGrupo(e.target.value.toUpperCase())} className="input" />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Alcance" value={alcance}>
            <input type="number" min={0} value={alcance} onChange={(e) => setAlcance(Number(e.target.value))} className="input" />
          </Field>
          <Field label="Actividad realizada" value={actividad}>
            <input type="text" value={actividad} onChange={(e) => setActividad(e.target.value.toUpperCase())} className="input" />
          </Field>
        </div>

        <div>
          <p className="text-[13px] font-medium text-neutral-700 mb-1.5">Tipo de atención</p>
          <CheckboxGroup opciones={TIPOS_ATENCION_360} valores={tipoAtencion} onToggle={(v) => toggle(tipoAtencion, setTipoAtencion, v)} />
          <Field label="Especifica (opcional)" value={otroTipoAtencion} className="mt-3">
            <input type="text" value={otroTipoAtencion} onChange={(e) => setOtroTipoAtencion(e.target.value.toUpperCase())} className="input" />
          </Field>
        </div>

        <div>
          <p className="text-[13px] font-medium text-neutral-700 mb-1.5">Alertas</p>
          <CheckboxGroup opciones={ALERTAS_360} valores={alertas} onToggle={(v) => toggle(alertas, setAlertas, v)} />
          <Field label="Especifica (opcional)" value={otraAlerta} className="mt-3">
            <input type="text" value={otraAlerta} onChange={(e) => setOtraAlerta(e.target.value.toUpperCase())} className="input" />
          </Field>
        </div>

        <Field label="Detalle de la alerta" value={detalleAlerta}>
          <textarea rows={2} value={detalleAlerta} onChange={(e) => setDetalleAlerta(e.target.value.toUpperCase())} className="input" />
        </Field>
        <Field label="Observaciones" value={observaciones}>
          <textarea rows={3} value={observaciones} onChange={(e) => setObservaciones(e.target.value.toUpperCase())} className="input" />
        </Field>

        {error && (
          <p className="text-sm text-danger flex items-center gap-1.5">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={guardar} loading={guardando}>
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
