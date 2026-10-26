-- Normaliza a mayúsculas los registros existentes de "atenciones": varios
-- campos de texto libre se guardaron en algún momento sin forzar mayúsculas
-- (ej. responsable_nombre se tomaba de profile.nombre_completo tal cual, sin
-- .toUpperCase(), hasta que se corrigió en el código). Esto es un fix de
-- datos, una sola vez — el código ya fuerza mayúsculas en todo lo nuevo.
-- upper(null) = null, así que no hace falta cuidar los campos vacíos.

update atenciones set
  fundo = upper(fundo),
  modulo = upper(modulo),
  grupo = upper(grupo),
  area = upper(area),
  falta = upper(falta),
  comentarios = upper(comentarios),
  sup_cuadrilla = upper(sup_cuadrilla),
  responsable_nombre = upper(responsable_nombre),
  reporte = upper(reporte),
  antecedente = upper(antecedente),
  notas_seguimiento = upper(notas_seguimiento),
  lider_cosecha = upper(lider_cosecha),
  detalle_alerta = upper(detalle_alerta),
  detalle_compromiso = upper(detalle_compromiso),
  evidencia_360 = upper(evidencia_360),
  resultado_compromiso = upper(resultado_compromiso),
  accion_correctiva = upper(accion_correctiva),
  detalle_cierre = upper(detalle_cierre);

-- involucrados: jsonb con un solo elemento {legajo, dni, nombre_completo,
-- es_afiliado} — se reconstruye el array con nombre_completo en mayúsculas.
update atenciones
set involucrados = (
  select coalesce(jsonb_agg(elem || jsonb_build_object('nombre_completo', upper(elem ->> 'nombre_completo'))), '[]'::jsonb)
  from jsonb_array_elements(involucrados) elem
)
where jsonb_array_length(involucrados) > 0;

-- alertas_reportadas (360 Laboral): detalle y accion son texto libre:
-- categoria/subcategoria vienen de un catálogo ya en mayúsculas, nivel y
-- cantidad no son texto libre.
update atenciones
set alertas_reportadas = (
  select coalesce(
    jsonb_agg(elem || jsonb_build_object('detalle', upper(elem ->> 'detalle'), 'accion', upper(elem ->> 'accion'))),
    '[]'::jsonb
  )
  from jsonb_array_elements(alertas_reportadas) elem
)
where jsonb_array_length(alertas_reportadas) > 0;

-- tipo_atencion_360: catálogo fijo + a lo más un valor libre ("OTRAS: ...").
update atenciones
set tipo_atencion_360 = (select array_agg(upper(x)) from unnest(tipo_atencion_360) x)
where tipo_atencion_360 is not null;

-- alertas_360 (legado, catálogo plano pre-recategorización).
update atenciones
set alertas_360 = (select array_agg(upper(x)) from unnest(alertas_360) x)
where alertas_360 is not null;
