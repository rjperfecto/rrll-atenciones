// Catálogo maestro TIPO -> CATEGORIA -> SUBCATEGORIA -> GRAVEDAD
// Extraído y depurado de la hoja "CATEGORIZACIÓN" del Excel histórico (ATENCIONES RRLL-2025.xlsx).
// Es la fuente de verdad única: reemplaza los VLOOKUP rotos del Excel que mezclaban
// números sueltos con BAJO/MEDIO/ALTO en la columna GRAVEDAD.

export type Gravedad = 'BAJO' | 'MEDIO' | 'ALTO'

export type Tipo =
  | 'CONSULTA'
  | 'INTERVENCIÓN'
  | 'RECLAMO'
  | 'COORDINACIÓN'
  | 'SOLICITUD'
  | 'PREVENTIVO'

export interface CategorizacionEntry {
  tipo: Tipo
  categoria: string
  subcategoria: string
  gravedad: Gravedad
}

export const TIPOS: Tipo[] = [
  'CONSULTA',
  'INTERVENCIÓN',
  'RECLAMO',
  'COORDINACIÓN',
  'SOLICITUD',
  'PREVENTIVO',
]

export const CATEGORIZACION: CategorizacionEntry[] = [
  // CONSULTA
  { tipo: 'CONSULTA', categoria: 'APLICAR MEDIDA DISCIPLINARIA', subcategoria: 'DERIVACIÓN A OTRA ÁREA', gravedad: 'BAJO' },
  { tipo: 'CONSULTA', categoria: 'USO DE APLICATIVOS (BERRYDICTO)', subcategoria: 'DERIVACIÓN AL EQUIPO', gravedad: 'BAJO' },
  { tipo: 'CONSULTA', categoria: 'DERIVACIÓN A OTRA ÁREA', subcategoria: 'APLICAR MEDIDA DISCIPLINARIA', gravedad: 'BAJO' },
  { tipo: 'CONSULTA', categoria: 'DERIVACION AL EQUIPO', subcategoria: 'FALLAS EN APLICATIVO', gravedad: 'BAJO' },
  { tipo: 'CONSULTA', categoria: 'CAMBIO DE ÁREA', subcategoria: 'PROCESO DE RRLL', gravedad: 'BAJO' },
  { tipo: 'CONSULTA', categoria: 'PROCESO DE RRLL', subcategoria: 'USO DE APLICATIVOS (BERRYDICTO)', gravedad: 'BAJO' },

  // COORDINACIÓN
  { tipo: 'COORDINACIÓN', categoria: 'CREACIÓN MEDIDA DISCIPLINARIA', subcategoria: 'CREACIÓN MEDIDA DISCIPLINARIA', gravedad: 'BAJO' },
  { tipo: 'COORDINACIÓN', categoria: 'REUNIONES CON PERSONAL OPERARIO', subcategoria: 'REUNIONES CON PERSONAL EMPLEADO', gravedad: 'BAJO' },
  { tipo: 'COORDINACIÓN', categoria: 'REUNIONES CON PERSONAL EMPLEADO', subcategoria: 'REUNIONES CON PERSONAL OPERARIO', gravedad: 'BAJO' },
  { tipo: 'COORDINACIÓN', categoria: 'TRÁMITES SINDICALES', subcategoria: 'TRÁMITES SINDICALES', gravedad: 'MEDIO' },

  // INTERVENCIÓN - INCUMPLIMIENTO BPA Y/O BPM
  { tipo: 'INTERVENCIÓN', categoria: 'INCUMPLIMIENTO BPA Y/O BPM', subcategoria: 'COSECHAR EN POTE DE DESCARTE', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'INCUMPLIMIENTO BPA Y/O BPM', subcategoria: 'TENER VELLO FACIAL SIN AFEITAR (BARBA SIN AFEITAR)', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'INCUMPLIMIENTO BPA Y/O BPM', subcategoria: 'TENER LAS UÑAS PINTADAS', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'INCUMPLIMIENTO BPA Y/O BPM', subcategoria: 'USAR MAQUILLAJE', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'INCUMPLIMIENTO BPA Y/O BPM', subcategoria: 'USAR BISUTERÍA (ARETES, COLLARES, ANILLOS, ETC.)', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'INCUMPLIMIENTO BPA Y/O BPM', subcategoria: 'INGRESAR FRUTA A FUNDO', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'INCUMPLIMIENTO BPA Y/O BPM', subcategoria: 'INGRESAR ENVASES O ARTÍCULOS DE VIDRIO', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'INCUMPLIMIENTO BPA Y/O BPM', subcategoria: 'INGERIR BEBIDAS O ALIMENTOS NO AUTORIZADOS', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'INCUMPLIMIENTO BPA Y/O BPM', subcategoria: 'USO DE DISPOSITIVOS ELECTRÓNICOS EN LUGARES NO AUTORIZADOS', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'INCUMPLIMIENTO BPA Y/O BPM', subcategoria: 'INGRESAR A SSHH Y/O COMEDORES CON IMPLEMENTOS O INDUMENTARIA', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'INCUMPLIMIENTO BPA Y/O BPM', subcategoria: 'ORINAR O DEFECAR EN LUGARES DISTINTOS A LOS SSHH', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'INCUMPLIMIENTO BPA Y/O BPM', subcategoria: 'INGRESAR RECIPIENTE CON AGUA AL SURCO', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'INCUMPLIMIENTO BPA Y/O BPM', subcategoria: 'OTRAS FALTAS DE BPA / BPM', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'INCUMPLIMIENTO BPA Y/O BPM', subcategoria: 'FOTOCHECK EXPUESTO EN LUGARES NO AUTORIZADOS', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'INCUMPLIMIENTO BPA Y/O BPM', subcategoria: 'VESTIMENTA NO AUTORIZADA(CALZADO ABIERTO; CHOMPA DE LANA; USO DE GUANTES; ETC.)', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'INCUMPLIMIENTO BPA Y/O BPM', subcategoria: 'USO DE PERFUMES Y/O AEROSOLES EN LUGARES NO AUTORIZADOS', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'INCUMPLIMIENTO BPA Y/O BPM', subcategoria: 'CONSUMO DE ARÁNDANOS NO AUTORIZADOS', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'INCUMPLIMIENTO BPA Y/O BPM', subcategoria: 'NO REPORTAR MANOS CON HERIDAS Y/O VERRUGAS', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'INCUMPLIMIENTO BPA Y/O BPM', subcategoria: 'LLENAR EL POTE SOBRE EL LÍMITE', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'INCUMPLIMIENTO BPA Y/O BPM', subcategoria: 'COLOCAR EXCESO CLAMSHELLS PERMITIDOS EN EL CARRITO', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'INCUMPLIMIENTO BPA Y/O BPM', subcategoria: 'ELEMENTOS NO AUTORIZADOS EN ACOPIO', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'INCUMPLIMIENTO BPA Y/O BPM', subcategoria: 'ENTERRAR FRUTA EN LUGARES NO AUTORIZADO', gravedad: 'MEDIO' },

  // INTERVENCIÓN - ACTOS CONTRA LA BUENA FE LABORAL
  { tipo: 'INTERVENCIÓN', categoria: 'ACTOS CONTRA LA BUENA FE LABORAL', subcategoria: 'NO REPORTAR INCUMPLIMIENTOS DE TRABAJADORES BAJO SU SUPERVISIÓN', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ACTOS CONTRA LA BUENA FE LABORAL', subcategoria: 'FRAUDE EN LA GESTIÓN DE ALMUERZOS', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ACTOS CONTRA LA BUENA FE LABORAL', subcategoria: 'ADULTERAR, TAPAR Y/O DAÑAR FOTOGRAFÍA DEL FOTOCHECK', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ACTOS CONTRA LA BUENA FE LABORAL', subcategoria: 'PROPORCIONAR INFORMACIÓN FALSA SOBRE EL TRABAJO', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ACTOS CONTRA LA BUENA FE LABORAL', subcategoria: 'OTROS ACTOS CONTRA LA BUENA FE LABORAL', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ACTOS CONTRA LA BUENA FE LABORAL', subcategoria: 'NO DECLARAR CONFLICTO DE INTERESES', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ACTOS CONTRA LA BUENA FE LABORAL', subcategoria: 'DAR DECLARACIONES UTILIZANDO EL NOMBRE DE LA EMPRESA', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ACTOS CONTRA LA BUENA FE LABORAL', subcategoria: 'MANIPULAR IRREGULARMENTE LOS STICKERS EN JABAS DE COSECHA', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ACTOS CONTRA LA BUENA FE LABORAL', subcategoria: 'SIMULAR ENFERMEDAD PARA TENER PERMISO DE SALIDA', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ACTOS CONTRA LA BUENA FE LABORAL', subcategoria: 'DELEGAR A OTRO COLABORADOR LA EJECUCIÓN DE SU TRABAJO SIN AUTORIZACIÓN', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ACTOS CONTRA LA BUENA FE LABORAL', subcategoria: 'BRINDAR INFORMACIÓN FALSA EN BENEFICIO DEL TRABAJADOR', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ACTOS CONTRA LA BUENA FE LABORAL', subcategoria: 'DIVULGAR INFORMACIÓN CONFIDENCIAL O RESERVADA', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ACTOS CONTRA LA BUENA FE LABORAL', subcategoria: 'BRINDAR INFORMACIÓN FALSA EN EXÁMENTES MÉDICOS-OCUPACIONALES', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ACTOS CONTRA LA BUENA FE LABORAL', subcategoria: 'APROVECHAR SU PUESTO Y/O CONDICIÓN PARA OBTENER BENEFICIOS', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ACTOS CONTRA LA BUENA FE LABORAL', subcategoria: 'HURTAR MATERIALES, HERRAMIENTAS U OTRO OBJETO', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ACTOS CONTRA LA BUENA FE LABORAL', subcategoria: 'SUPLANTAR A UN TRABAJADOR O SOLICITAR SER SUPLANTADO', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ACTOS CONTRA LA BUENA FE LABORAL', subcategoria: 'MANIPULAR LA INFORMACIÓN EN EL TAREO MÓVIL', gravedad: 'ALTO' },

  // INTERVENCIÓN - UNIFORME
  { tipo: 'INTERVENCIÓN', categoria: 'UNIFORME', subcategoria: 'OLVIDAR TOMA AGUA BRINDADO POR RECURSOS HUMANOS', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'UNIFORME', subcategoria: 'OMITIR USO DE POLO MANGA LARGA AL REALIZAR SUS ACTIVIDADES EN CAMPO', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'UNIFORME', subcategoria: 'NO USAR GORRO ARABE PARA PROTECCIÓN SOLAR', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'UNIFORME', subcategoria: 'OTRAS FALTAS POR UNIFORME', gravedad: 'BAJO' },

  // INTERVENCIÓN - SEGURIDAD Y RIT
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'NO USAR EQUIPOS DE PROTECCIÓN PERSONAL', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'INCUMPLIMIENTO EN LA DISPOSICIÓN DE RESIDUOS', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'NO RESPETAR LOS LÍMITES DE VELOCIDAD VEHICULAR', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'TRANSITAR Y/O CAMINAR POR ZONAS RESTRINGIDAS', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'NO RESPETAR LAS SEÑALIZACIONES DE SEGURIDAD', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'FUMAR EN LUGARES PROHIBIDOS', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'SALIR DE CAMPO CAMINANDO HASTA GARITA SIN ESPERAR A LA MOVILIDAD ASIGNADA', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'UTILIZAR EQUIPOS NO AUTORIZADOS', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'NO REALIZAR CHECK LIST ANTES DE OPERAR EQUIPOS', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'NO SOMETERSE A EXÁMENES MÉDICOS', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'NO ENTREGAR EPP´S AL PERSONAL A SU CARGO', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'PERMITIR/ ASIGNAR LABORES DE ALTO RIESGO A PERSONAL NO CALIFICADO O ENTRENADO PARA EL MISMO', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'INGRESAR O RETIRARSE DE LA EMPRESA POR ZONAS NO AUTORIZADAS', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'TRANSPORTAR PASAJEROS EN EXCESO A LO PERMITIDO POR LA UNIDAD VEHICULAR Y/O MAQUINARIA', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'VIAJAR EN LA TOLVA DE VEHÍCULO NO ASIGANADA PARA TAL FIN', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'SUBIR O BAJAR DE VEHÍCULOS EN MOVIMIENTO', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'PERMITIR QUE LOS TRABAJADORES A SU CARGO REALICEN LABORES EN CONDICIONES INSEGURAS O REALIZANDO ACTOS INSEGUROS', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'NO REALIZAR EL PERMISO DE TRABAJO O ANÁLISIS DE RIESGO ANTES DE EJECUTAR LA LABOR', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'NO REALIZAR LA LABOR TENIENDO EN CUENTA EL PERMISO DE TRABAJO O ANÁLISIS DE RIESGO', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'CARGAR MÁS JABAS DE LO PERMITIDO', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'OTRAS FALTAS DE SEGURIDAD', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'REALIZAR ACTOS INSEGUROS', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'NO COMUNICAR ACCIDENTES', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'SEGURIDAD Y RIT', subcategoria: 'NO COMUNICAR CONDICIONES INSEGURAS, RIESGOS Y/O PELIGROS', gravedad: 'BAJO' },

  // INTERVENCIÓN - FALTAS DE SEGURIDAD PATRIMONIAL
  { tipo: 'INTERVENCIÓN', categoria: 'FALTAS DE SEGURIDAD PATRIMONIAL', subcategoria: 'NO SEGUIR EL PROCEDIMIENTO PARA RETIRAR MATERIAL', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'FALTAS DE SEGURIDAD PATRIMONIAL', subcategoria: 'OTRAS FALTAS DE SEGURIDAD PATRIMONIAL', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'FALTAS DE SEGURIDAD PATRIMONIAL', subcategoria: 'VEHÍCULO MAL ESTACIONADO', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'FALTAS DE SEGURIDAD PATRIMONIAL', subcategoria: 'INGRESO DE MATERIALES PROHIBIDOS', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'FALTAS DE SEGURIDAD PATRIMONIAL', subcategoria: 'ROBO FRUSTRADO DE MATERIAL', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'FALTAS DE SEGURIDAD PATRIMONIAL', subcategoria: 'ROBO FRUSTRADO DE MATERIA PRIMA', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'FALTAS DE SEGURIDAD PATRIMONIAL', subcategoria: 'CONDUCIR EN ESTADO ETÍLICO', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'FALTAS DE SEGURIDAD PATRIMONIAL', subcategoria: 'FORZAMIENTO DE ACCESOS', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'FALTAS DE SEGURIDAD PATRIMONIAL', subcategoria: 'UTILIZAR INFLUENCIAS PARA INTERCEDER POR TERCEROS', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'FALTAS DE SEGURIDAD PATRIMONIAL', subcategoria: 'REALIZAR MANIOBRAS TEMERARIAS', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'FALTAS DE SEGURIDAD PATRIMONIAL', subcategoria: 'INCUMPLIMIENTO A LAS SEÑALES DE TRANSITO', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'FALTAS DE SEGURIDAD PATRIMONIAL', subcategoria: 'CONDUCIR SIN LICENCIA, LICENCIA VENCIDA O CATEGORIA NO ADECUADA', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'FALTAS DE SEGURIDAD PATRIMONIAL', subcategoria: 'DETERIORO DE BIENES ACTIVOS DE LA ORGANIZACIÓN', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'FALTAS DE SEGURIDAD PATRIMONIAL', subcategoria: 'DESCUIDO DE AMBIENTES Y/O MATERIAL', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'FALTAS DE SEGURIDAD PATRIMONIAL', subcategoria: 'INGRESOS PROHIBIDOS', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'FALTAS DE SEGURIDAD PATRIMONIAL', subcategoria: 'EXCESO DE VELOCIDAD', gravedad: 'MEDIO' },

  // INTERVENCIÓN - ASISTENCIA Y/O PUNTUALIDAD
  { tipo: 'INTERVENCIÓN', categoria: 'ASISTENCIA Y/O PUNTUALIDAD', subcategoria: 'JUSTIFICAR INASISTENCIA FUERA DE PLAZO', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ASISTENCIA Y/O PUNTUALIDAD', subcategoria: 'COMUNICAR  INASISTENCIA', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ASISTENCIA Y/O PUNTUALIDAD', subcategoria: 'ABANDONO DEL PUESTO DE TRABAJO SIN JUSTIFICACIÓN', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ASISTENCIA Y/O PUNTUALIDAD', subcategoria: 'FALTAR AL CENTRO DE TRABAJO SIN JUSTIFICACIÓN', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ASISTENCIA Y/O PUNTUALIDAD', subcategoria: 'LLEGAR TARDE AL CENTRO DE TRABAJO SIN JUSTIFICACIÓN', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ASISTENCIA Y/O PUNTUALIDAD', subcategoria: 'DEMORARSE EN OCUPAR SU PUESTO DE TRABAJO', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ASISTENCIA Y/O PUNTUALIDAD', subcategoria: 'UTILIZAR LOS PERMISOS Y/O LICENCIAS PARA OTROS FINES', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ASISTENCIA Y/O PUNTUALIDAD', subcategoria: 'OTRAS FALTAS DE ASISTENCIA Y/O PUNTUALIDAD', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ASISTENCIA Y/O PUNTUALIDAD', subcategoria: 'NO REGISTRAR CORRECTAMENTE LA ASISTENCIA', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ASISTENCIA Y/O PUNTUALIDAD', subcategoria: 'FALTAR O LLEGAR TARDE A CAPACITACIONES PROGRAMADA', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'ASISTENCIA Y/O PUNTUALIDAD', subcategoria: 'SUPLANTACIÓN DE IDENTIDAD PARA REGISTRO DE ASISTENCIA', gravedad: 'ALTO' },

  // INTERVENCIÓN - USO Y CUIDADO DE BIENES
  { tipo: 'INTERVENCIÓN', categoria: 'USO Y CUIDADO DE BIENES', subcategoria: 'USO INADECUADO DE EQUIPOS', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'USO Y CUIDADO DE BIENES', subcategoria: 'DEVOLVER EQUIPOS, MAQUINARIA U HERRAMIENTAS FUERA DE HORA', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'USO Y CUIDADO DE BIENES', subcategoria: 'OTRAS FALTAS DE USO Y CUIDADO DE BIENES', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'USO Y CUIDADO DE BIENES', subcategoria: 'MATERIAL EXPUESTO A PÉRDIDA', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'USO Y CUIDADO DE BIENES', subcategoria: 'DAÑAR O EXTRAVIAR FOTOCHECK', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'USO Y CUIDADO DE BIENES', subcategoria: 'PERDER EQUIPOS Y/O HERRAMIENTAS', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'USO Y CUIDADO DE BIENES', subcategoria: 'DAÑAR O DETERIORAR POR NEGLIGENCIA BIENES DE LA EMPRESA', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'USO Y CUIDADO DE BIENES', subcategoria: 'DAÑAR O DETERIORAR INTENCIONALMENTE BIENES DE LA EMPRESA', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'USO Y CUIDADO DE BIENES', subcategoria: 'NO REPORTAR PÉRDIDAS O DAÑOS DE HERRAMIENTAS, EQUIPOS O BIENES', gravedad: 'MEDIO' },

  // INTERVENCIÓN - EJECUCIÓN DEL TRABAJO
  { tipo: 'INTERVENCIÓN', categoria: 'EJECUCIÓN DEL TRABAJO', subcategoria: 'COSECHAR FRUTA CON DEFECTO', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'EJECUCIÓN DEL TRABAJO', subcategoria: 'DEJAR FRUTA EN PLANTA', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'EJECUCIÓN DEL TRABAJO', subcategoria: 'NO REALIZAR MONITOREO DE COSECHADORES (LLENADO DE CARTILLA)', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'EJECUCIÓN DEL TRABAJO', subcategoria: 'EJECUTAR UNA LABOR NO DESIGNADA', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'EJECUCIÓN DEL TRABAJO', subcategoria: 'JABAS MAL LLENADAS', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'EJECUCIÓN DEL TRABAJO', subcategoria: 'ERRORES EN LA PROGRAMACIÓN DE TRANSPORTE DE PERSONAL', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'EJECUCIÓN DEL TRABAJO', subcategoria: 'NO COORDINAR SERVICIOS DE TRANSPORTE DE PERSONAL', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'EJECUCIÓN DEL TRABAJO', subcategoria: 'DEJAR FRUTA EN ACOPIO', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'EJECUCIÓN DEL TRABAJO', subcategoria: 'NO SINCRONIZAR EN EL COMEDOR ASIGNADO', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'EJECUCIÓN DEL TRABAJO', subcategoria: 'SINCRONIZAR LOS ALMUERZOS A DESTIEMPO', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'EJECUCIÓN DEL TRABAJO', subcategoria: 'OTRAS FALTAS DE EJECUCIÓN DEL TRABAJO', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'EJECUCIÓN DEL TRABAJO', subcategoria: 'INCUMPLIR PROCEDIMIENTOS DE TRABAJO', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'EJECUCIÓN DEL TRABAJO', subcategoria: 'INCUMPLIMIENTO DE CALIDAD', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'EJECUCIÓN DEL TRABAJO', subcategoria: 'NO SINCRONIZAR LOS ALMUERZOS', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'EJECUCIÓN DEL TRABAJO', subcategoria: 'SUSPENDER INTEMPESTIVAMENTE LABORES', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'EJECUCIÓN DEL TRABAJO', subcategoria: 'PARALIZACIÓN INTEMPESTIVA DE LABORES', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'EJECUCIÓN DEL TRABAJO', subcategoria: 'NO ACATAR CAMBIO DE PUESTO', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'EJECUCIÓN DEL TRABAJO', subcategoria: 'REGISTRAR ASISTENCIA FUERA DE HORA', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'EJECUCIÓN DEL TRABAJO', subcategoria: 'DEJAR FLORES SIN PINTAR (FNP)', gravedad: 'BAJO' },

  // INTERVENCIÓN - COMPORTAMIENTO
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'INGRESO DE CELULAR EN PACKING Y/O ELEMENTOS NO AUTORIZADOS', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'RESISTENCIA A CUMPLIR INDICACIONES', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'FALTA DE RESPETO', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'CAUSAR DESORDEN O INDISCIPLINA', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'DORMIR EN HORA DE TRABAJO', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'COMERCIO, COLECTAS Y RIFAS', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'NO ASISTIR A CAPACITACIONES', gravedad: 'BAJO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'OTRAS FALTAS DE COMPORTAMIENTO', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'FRAUDE ALIMENTICIO', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'REALIZAR ACTIVIDADES AJENAS AL TRABAJO', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'AUTORIZAR Y/O PERMITIR EL USO DE EQUIPOS, HERRAMIENTAS, VEHÍCULOS Y/O MAQUINARIA A PERSONAL NO CAPACITADO', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'NO COMUNICAR ROBOS', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'ASISITIR EN ESTADO DE EBRIEDAD AL CENTRO DE LABORES', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'ASISTIR BAJO INFLUENCIA DE DROGAS Y/O DISTRIBUIRLAS', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'COMETER ACTOS CONTRA LA MORAL Y BUENAS COSTUMBRES', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'MANEJAR U OPERAR EQUIPOS, MAQUINAS O VEHÍCULOS SIN AUTORIZACIÓN', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'ACEPTAR DÁDIVAS', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'HOSTIGAMIENTO SEXUAL O ACOSO', gravedad: 'MEDIO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'AGREDIR VERBAL Y/O FÍSICA AL PERSONAL', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'REGISTRAR ASITENCIA SIN HABER LABORADO', gravedad: 'ALTO' },
  { tipo: 'INTERVENCIÓN', categoria: 'COMPORTAMIENTO', subcategoria: 'AMENAZAR AL PERSONAL', gravedad: 'ALTO' },

  // PREVENTIVO
  { tipo: 'PREVENTIVO', categoria: 'CONDICIONES DE TRABAJO', subcategoria: 'CONDICIONES DE TRABAJO', gravedad: 'BAJO' },
  { tipo: 'PREVENTIVO', categoria: 'CONTROL DE IDENTIDAD', subcategoria: 'CONTROL DE IDENTIDAD', gravedad: 'BAJO' },
  { tipo: 'PREVENTIVO', categoria: 'VISITA PARADEROS', subcategoria: 'VISITA PARADEROS', gravedad: 'BAJO' },
  { tipo: 'PREVENTIVO', categoria: 'DECLARACIÓN DE VÍNCULO', subcategoria: 'DECLARACIÓN DE VÍNCULO', gravedad: 'MEDIO' },
  { tipo: 'PREVENTIVO', categoria: 'DESPLIEGUE DE COMUNICACIÓN', subcategoria: 'DESPLIEGUE DE COMUNICACIÓN', gravedad: 'BAJO' },

  // RECLAMO
  { tipo: 'RECLAMO', categoria: 'DESCANSO TEMPORAL', subcategoria: 'DESCANSO TEMPORAL', gravedad: 'ALTO' },
  { tipo: 'RECLAMO', categoria: 'TAREA EXCESIVA', subcategoria: 'EXCESO DE TAREA', gravedad: 'MEDIO' },
  { tipo: 'RECLAMO', categoria: 'MALTRATO SUPERVISOR', subcategoria: 'MALTRATO SUPERVISOR', gravedad: 'ALTO' },
  { tipo: 'RECLAMO', categoria: 'ODP', subcategoria: 'ODP', gravedad: 'BAJO' },
  { tipo: 'RECLAMO', categoria: 'PÉRDIDA DE JABAS', subcategoria: 'PÉRDIDA DE JABAS', gravedad: 'ALTO' },
  { tipo: 'RECLAMO', categoria: 'PREFERENCIAS EN LA TOMA DE DECISIONES', subcategoria: 'PREFERENCIAS EN LA TOMA DE DECISIONES', gravedad: 'ALTO' },
  { tipo: 'RECLAMO', categoria: 'ROTACIÓN DE ZONA/FUNDO POR BAJA OFERTA DE FRUTA', subcategoria: 'ROTACIÓN DE ZONA/FUNDO POR BAJA OFERTA DE FRUTA', gravedad: 'ALTO' },
  { tipo: 'RECLAMO', categoria: 'APLICACIÓN DE MEDIDAS DISCIPLINARIAS', subcategoria: 'APLICACIÓN DE MEDIDAS DISCIPLINARIAS', gravedad: 'MEDIO' },

  // SOLICITUD
  { tipo: 'SOLICITUD', categoria: 'ENTREGA DE DOCUMENTOS', subcategoria: 'ENTREGA DE DOCUMENTOS', gravedad: 'BAJO' },
  { tipo: 'SOLICITUD', categoria: 'REVISIÓN DE INFORMACIÓN', subcategoria: 'DATA DE NO APTOS', gravedad: 'BAJO' },
  { tipo: 'SOLICITUD', categoria: 'REVISIÓN DE INFORMACIÓN', subcategoria: 'ODP', gravedad: 'BAJO' },
  { tipo: 'SOLICITUD', categoria: 'REVISIÓN DE INFORMACIÓN', subcategoria: 'MEDIDAS DISCIPLINARIAS', gravedad: 'BAJO' },
  { tipo: 'SOLICITUD', categoria: 'REVISIÓN DE INFORMACIÓN', subcategoria: 'REVISIÓN DE INFORMACIÓN', gravedad: 'BAJO' },
  { tipo: 'SOLICITUD', categoria: 'REVISIÓN DE INFORMACIÓN', subcategoria: 'SUNAFIL', gravedad: 'ALTO' },
  { tipo: 'SOLICITUD', categoria: 'CAMBIO DE GRUPO', subcategoria: 'CAMBIO DE GRUPO', gravedad: 'BAJO' },
  { tipo: 'SOLICITUD', categoria: 'CAMBIO DE ACTIVIDAD', subcategoria: 'CAMBIO DE ACTIVIDAD', gravedad: 'BAJO' },
  { tipo: 'SOLICITUD', categoria: 'CAMBIO DE ÁREA', subcategoria: 'CAMBIO DE ÁREA', gravedad: 'BAJO' },
  { tipo: 'SOLICITUD', categoria: 'SUNAFIL', subcategoria: 'SUNAFIL', gravedad: 'BAJO' },
  { tipo: 'SOLICITUD', categoria: 'TRASLADO DE PERSONAL', subcategoria: 'TRASLADO DE PERSONAL', gravedad: 'BAJO' },
]

export function categoriasPorTipo(tipo: Tipo): string[] {
  return [...new Set(CATEGORIZACION.filter((e) => e.tipo === tipo).map((e) => e.categoria))]
}

export function subcategoriasPorCategoria(tipo: Tipo, categoria: string): string[] {
  return [
    ...new Set(
      CATEGORIZACION.filter((e) => e.tipo === tipo && e.categoria === categoria).map((e) => e.subcategoria),
    ),
  ]
}

export function gravedadDe(tipo: Tipo, categoria: string, subcategoria: string): Gravedad | undefined {
  return CATEGORIZACION.find(
    (e) => e.tipo === tipo && e.categoria === categoria && e.subcategoria === subcategoria,
  )?.gravedad
}
