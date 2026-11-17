// Catálogo de los párrafos/títulos de texto fijo de las dos cartas de 360
// Laboral (cartaCompromisos360.ts, cartaVerificacion360.ts) que se pueden
// editar desde Administración > Textos de cartas 360 (ver
// src/features/admin/TextosCartas360.tsx). defaultTexto es exactamente el
// texto que ya venía hardcodeado en cada carta — si nadie edita nada, el
// documento sale idéntico a como salía antes. Las listas de alertas/
// compromisos, el encabezado y las firmas no están acá: se arman solas,
// no son "texto fijo".

export interface CampoTextoCarta360 {
  id: string
  etiqueta: string
  // Variables {{...}} que esa carta reemplaza en el texto al generarse —
  // ver aplicarPlaceholders más abajo.
  ayuda?: string
  defaultTexto: string
}

export const CAMPOS_CARTA_COMPROMISOS: CampoTextoCarta360[] = [
  {
    id: 'intro',
    etiqueta: 'Párrafo de introducción',
    ayuda: 'Variables disponibles: {{fecha}}, {{grupo}}, {{fundo}}, {{liderCosecha}}',
    defaultTexto:
      'Por medio de la presente nos dirigimos a usted en el marco del programa Caminata Laboral 360° realizada el {{fecha}} al grupo {{grupo}}, del área {{fundo}}, a cargo del líder/supervisor {{liderCosecha}}, con el fin de dejar constancia de lo conversado y de los compromisos asumidos.',
  },
  { id: 'tituloAlertas', etiqueta: 'Título: lista de alertas', defaultTexto: 'Alertas encontradas' },
  { id: 'introAlertas', etiqueta: 'Texto antes de la lista de alertas', defaultTexto: 'Durante la visita se identificaron los siguientes aspectos:' },
  { id: 'tituloCompromisosLider', etiqueta: 'Título: compromisos del líder', defaultTexto: 'Compromisos asumidos del líder' },
  {
    id: 'introCompromisosLider',
    etiqueta: 'Texto antes de los compromisos del líder',
    defaultTexto: 'A partir de lo anterior, usted se compromete de manera voluntaria a lo siguiente:',
  },
  { id: 'tituloCompromisosRrll', etiqueta: 'Título: compromisos de RRLL', defaultTexto: 'Compromisos asumidos por RRL' },
  {
    id: 'cierre1',
    etiqueta: 'Párrafo de cierre 1',
    defaultTexto:
      'Asimismo, le informamos que la Caminata Laboral 360° es un programa permanente de presencia preventiva de Relaciones Laborales en campo, orientado a fortalecer la cercanía con los trabajadores, atender sus consultas, identificar oportunamente alertas y promover un ambiente de trabajo basado en el respeto, la comunicación y la confianza.',
  },
  {
    id: 'cierre2',
    etiqueta: 'Párrafo de cierre 2',
    defaultTexto:
      'La información recogida durante la visita se utiliza exclusivamente con fines preventivos y de mejora organizacional, se trata de forma confidencial y no genera ninguna forma de represalia o discriminación.',
  },
]

export const CAMPOS_CARTA_VERIFICACION: CampoTextoCarta360[] = [
  {
    id: 'intro',
    etiqueta: 'Párrafo de introducción',
    ayuda: 'Variables disponibles: {{fechaCartaAnterior}}, {{fechaVisita}}, {{grupo}}, {{fundo}}, {{liderCosecha}}',
    defaultTexto:
      'Por medio de la presente, en el marco del programa Caminata Laboral 360°, Relaciones Laborales deja constancia de la verificación de los compromisos asumidos por usted en la carta de fecha {{fechaCartaAnterior}}, emitida tras la visita realizada el {{fechaVisita}} al grupo {{grupo}}, del área {{fundo}}, a cargo del líder/supervisor {{liderCosecha}}.',
  },
  { id: 'tituloResultado', etiqueta: 'Título: resultado de la verificación', defaultTexto: 'Resultado de la verificación' },
  {
    id: 'introResultado',
    etiqueta: 'Texto antes de los resultados',
    defaultTexto: 'En la fecha indicada se verificó el estado de cada compromiso, con el siguiente resultado:',
  },
  { id: 'tituloCompromisosLider', etiqueta: 'Título: compromisos del líder', defaultTexto: 'Compromisos del líder' },
  { id: 'tituloCompromisosRrll', etiqueta: 'Título: compromisos de RRLL', defaultTexto: 'Compromisos de RRLL' },
  { id: 'tituloObservaciones', etiqueta: 'Título: observaciones', defaultTexto: 'Observaciones' },
  { id: 'tituloResultadoGeneral', etiqueta: 'Título: resultado general', defaultTexto: 'Resultado general' },
  {
    id: 'resultadoCierreEfectivo',
    etiqueta: 'Texto: resultado "cierre efectivo"',
    defaultTexto: 'Cierre efectivo: los compromisos fueron cumplidos y se da por cerrado el seguimiento.',
  },
  {
    id: 'resultadoSeguimientoAdicional',
    etiqueta: 'Texto: resultado "seguimiento adicional"',
    ayuda: 'Variable disponible: {{nuevaFechaVerificacion}}',
    defaultTexto: 'Seguimiento adicional: se mantiene en seguimiento. Nueva fecha de verificación: {{nuevaFechaVerificacion}}.',
  },
  {
    id: 'cierre',
    etiqueta: 'Párrafo de cierre',
    defaultTexto:
      'Le recordamos que, según el protocolo del programa, Relaciones Laborales da seguimiento a los compromisos hasta verificar su cierre efectivo con la evidencia correspondiente. Agradecemos su disposición y colaboración.',
  },
]

export function aplicarPlaceholders(texto: string, valores: Record<string, string>): string {
  return texto.replace(/\{\{(\w+)\}\}/g, (coincidencia, clave: string) => valores[clave] ?? coincidencia)
}
