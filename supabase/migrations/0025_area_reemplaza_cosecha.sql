-- Ya no se divide Registrar entre GENERAL/COSECHA: se registra todo igual
-- (tipo_registro interno siempre 'GENERAL' para lo que no es 360 Laboral) y
-- se usa el campo Área para filtrar Cosecha en el historial y el Dashboard.
-- Las 6 atenciones que ya tenían tipo_registro='COSECHA' ya tienen area=
-- 'COSECHA' (confirmado antes de aplicar esto), así que no se pierde nada.
update atenciones set tipo_registro = 'GENERAL' where tipo_registro = 'COSECHA';

drop function casos_por_zona(text[], int, int);
drop function casos_por_gravedad(text[], int, int);
drop function casos_por_responsable_gravedad(text[], int, int);
drop function casos_por_zona_gravedad(text[], int, int);
drop function casos_por_estado(text[], int, int);
drop function casos_por_semana(text[]);

create function casos_por_zona(p_tipos_registro text[], p_anio int default null, p_semana int default null, p_area text default null)
returns table(zona text, casos bigint, pct numeric)
language sql stable as $$
  select zona, count(*) as casos,
    round(100.0 * count(*) / greatest(1, sum(count(*)) over ()), 1) as pct
  from atenciones
  where tipo_registro = any(p_tipos_registro)
    and (p_anio is null or extract(isoyear from fecha)::int = p_anio)
    and (p_semana is null or extract(week from fecha)::int = p_semana)
    and (p_area is null or area = p_area)
  group by zona;
$$;

create function casos_por_gravedad(p_tipos_registro text[], p_anio int default null, p_semana int default null, p_area text default null)
returns table(gravedad text, casos bigint)
language sql stable as $$
  select gravedad, count(*) as casos
  from atenciones
  where tipo_registro = any(p_tipos_registro)
    and (p_anio is null or extract(isoyear from fecha)::int = p_anio)
    and (p_semana is null or extract(week from fecha)::int = p_semana)
    and (p_area is null or area = p_area)
  group by gravedad;
$$;

create function casos_por_responsable_gravedad(p_tipos_registro text[], p_anio int default null, p_semana int default null, p_area text default null)
returns table(responsable text, gravedad text, casos bigint)
language sql stable as $$
  select responsable_nombre as responsable, gravedad, count(*) as casos
  from atenciones
  where tipo_registro = any(p_tipos_registro)
    and (p_anio is null or extract(isoyear from fecha)::int = p_anio)
    and (p_semana is null or extract(week from fecha)::int = p_semana)
    and (p_area is null or area = p_area)
  group by responsable_nombre, gravedad
  order by responsable_nombre, gravedad;
$$;

create function casos_por_zona_gravedad(p_tipos_registro text[], p_anio int default null, p_semana int default null, p_area text default null)
returns table(zona text, gravedad text, casos bigint)
language sql stable as $$
  select zona, gravedad, count(*) as casos
  from atenciones
  where tipo_registro = any(p_tipos_registro)
    and (p_anio is null or extract(isoyear from fecha)::int = p_anio)
    and (p_semana is null or extract(week from fecha)::int = p_semana)
    and (p_area is null or area = p_area)
  group by zona, gravedad
  order by zona;
$$;

create function casos_por_estado(p_tipos_registro text[], p_anio int default null, p_semana int default null, p_area text default null)
returns table(estado text, casos bigint)
language sql stable as $$
  select estado, count(*) as casos
  from atenciones
  where tipo_registro = any(p_tipos_registro)
    and (p_anio is null or extract(isoyear from fecha)::int = p_anio)
    and (p_semana is null or extract(week from fecha)::int = p_semana)
    and (p_area is null or area = p_area)
  group by estado;
$$;

create function casos_por_semana(p_tipos_registro text[], p_area text default null)
returns table(anio int, semana int, casos bigint)
language sql stable as $$
  select extract(isoyear from fecha)::int as anio, extract(week from fecha)::int as semana, count(*) as casos
  from atenciones
  where tipo_registro = any(p_tipos_registro)
    and (p_area is null or area = p_area)
  group by 1, 2
  order by 1, 2;
$$;
