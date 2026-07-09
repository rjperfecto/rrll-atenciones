-- Vistas que reemplazan la hoja "INDICADOR" del Excel (tablas dinámicas
-- semana/zona/gravedad/responsable). El dashboard de la app hoy las calcula
-- en el cliente sobre los datos locales; estas vistas quedan disponibles
-- para reportes SQL directos o un futuro dashboard server-side.

create view v_casos_por_semana as
  select
    extract(isoyear from fecha)::int as anio,
    extract(week from fecha)::int as semana,
    count(*) as casos
  from atenciones
  group by 1, 2
  order by 1, 2;

create view v_casos_por_zona as
  select
    zona,
    count(*) as casos,
    round(100.0 * count(*) / sum(count(*)) over (), 1) as pct
  from atenciones
  group by zona;

create view v_casos_por_gravedad as
  select gravedad, count(*) as casos
  from atenciones
  group by gravedad;

create view v_responsable_x_gravedad as
  select
    responsable_nombre as responsable,
    gravedad,
    count(*) as casos
  from atenciones
  group by responsable_nombre, gravedad
  order by responsable_nombre, gravedad;
