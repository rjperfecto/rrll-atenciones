-- Fusiona el Dashboard de Atenciones con el de Cosecha: el filtro de tipo ya
-- no es un solo tipo_registro, es una lista (TODOS = GENERAL+COSECHA,
-- COSECHA = solo COSECHA; 360 Laboral sigue aparte, con su propia lista de
-- un solo elemento). Se recrean los 5 RPC de 0017/0020 con
-- p_tipos_registro text[] en vez de p_tipo_registro text.
drop function casos_por_zona(text, int, int);
drop function casos_por_gravedad(text, int, int);
drop function casos_por_responsable_gravedad(text, int, int);
drop function casos_por_zona_gravedad(text, int, int);
drop function casos_por_estado(text, int, int);

create function casos_por_zona(p_tipos_registro text[], p_anio int default null, p_semana int default null)
returns table(zona text, casos bigint, pct numeric)
language sql stable as $$
  select zona, count(*) as casos,
    round(100.0 * count(*) / greatest(1, sum(count(*)) over ()), 1) as pct
  from atenciones
  where tipo_registro = any(p_tipos_registro)
    and (p_anio is null or extract(isoyear from fecha)::int = p_anio)
    and (p_semana is null or extract(week from fecha)::int = p_semana)
  group by zona;
$$;

create function casos_por_gravedad(p_tipos_registro text[], p_anio int default null, p_semana int default null)
returns table(gravedad text, casos bigint)
language sql stable as $$
  select gravedad, count(*) as casos
  from atenciones
  where tipo_registro = any(p_tipos_registro)
    and (p_anio is null or extract(isoyear from fecha)::int = p_anio)
    and (p_semana is null or extract(week from fecha)::int = p_semana)
  group by gravedad;
$$;

create function casos_por_responsable_gravedad(p_tipos_registro text[], p_anio int default null, p_semana int default null)
returns table(responsable text, gravedad text, casos bigint)
language sql stable as $$
  select responsable_nombre as responsable, gravedad, count(*) as casos
  from atenciones
  where tipo_registro = any(p_tipos_registro)
    and (p_anio is null or extract(isoyear from fecha)::int = p_anio)
    and (p_semana is null or extract(week from fecha)::int = p_semana)
  group by responsable_nombre, gravedad
  order by responsable_nombre, gravedad;
$$;

create function casos_por_zona_gravedad(p_tipos_registro text[], p_anio int default null, p_semana int default null)
returns table(zona text, gravedad text, casos bigint)
language sql stable as $$
  select zona, gravedad, count(*) as casos
  from atenciones
  where tipo_registro = any(p_tipos_registro)
    and (p_anio is null or extract(isoyear from fecha)::int = p_anio)
    and (p_semana is null or extract(week from fecha)::int = p_semana)
  group by zona, gravedad
  order by zona;
$$;

create function casos_por_estado(p_tipos_registro text[], p_anio int default null, p_semana int default null)
returns table(estado text, casos bigint)
language sql stable as $$
  select estado, count(*) as casos
  from atenciones
  where tipo_registro = any(p_tipos_registro)
    and (p_anio is null or extract(isoyear from fecha)::int = p_anio)
    and (p_semana is null or extract(week from fecha)::int = p_semana)
  group by estado;
$$;
