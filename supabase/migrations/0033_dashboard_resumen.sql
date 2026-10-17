-- Dashboard > Resumen: a diferencia de los RPC de 0017/0022/0024 (una sola
-- semana a la vez), acá el filtro admite VARIAS semanas ISO juntas (ej. 40,
-- 41 y 42 combinadas), para "Atenciones por responsable", "360 Laboral por
-- responsable" y el % de cobertura por zona.

create function casos_por_responsable_semanas(
  p_tipos_registro text[], p_anio int default null, p_semanas int[] default null, p_area text default null
)
returns table(responsable text, casos bigint)
language sql stable as $$
  select responsable_nombre as responsable, count(*) as casos
  from atenciones
  where tipo_registro = any(p_tipos_registro)
    and (p_anio is null or extract(isoyear from fecha)::int = p_anio)
    and (p_semanas is null or extract(week from fecha)::int = any(p_semanas))
    and (p_area is null or area = p_area)
  group by responsable_nombre
  order by casos desc;
$$;

create function casos_por_zona_semanas(
  p_tipos_registro text[], p_anio int default null, p_semanas int[] default null, p_area text default null
)
returns table(zona text, casos bigint)
language sql stable as $$
  select zona, count(*) as casos
  from atenciones
  where tipo_registro = any(p_tipos_registro)
    and (p_anio is null or extract(isoyear from fecha)::int = p_anio)
    and (p_semanas is null or extract(week from fecha)::int = any(p_semanas))
    and (p_area is null or area = p_area)
  group by zona;
$$;
