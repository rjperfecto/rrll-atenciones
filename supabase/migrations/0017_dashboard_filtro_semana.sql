-- El Dashboard necesita filtrar por semana ISO (además de tipo_registro), algo
-- que una vista fija no puede hacer. Reemplaza las vistas fijas de 0004/0010/
-- 0011/0015 (excepto v_casos_por_semana, que sigue sirviendo la tendencia de
-- las últimas 12 semanas sin filtrar por semana) por funciones parametrizadas:
-- p_anio/p_semana en null = sin filtrar (mismo resultado que la vista antes).
-- language sql + sin "security definer" = security invoker por default, así
-- que respetan RLS de atenciones igual que las vistas (con security_invoker=true).

drop view if exists v_casos_por_zona;
drop view if exists v_casos_por_gravedad;
drop view if exists v_responsable_x_gravedad;
drop view if exists v_casos_por_estado;

create function casos_por_zona(p_tipo_registro text, p_anio int default null, p_semana int default null)
returns table(zona text, casos bigint, pct numeric)
language sql stable as $$
  select zona, count(*) as casos,
    round(100.0 * count(*) / greatest(1, sum(count(*)) over ()), 1) as pct
  from atenciones
  where tipo_registro = p_tipo_registro
    and (p_anio is null or extract(isoyear from fecha)::int = p_anio)
    and (p_semana is null or extract(week from fecha)::int = p_semana)
  group by zona;
$$;

create function casos_por_gravedad(p_tipo_registro text, p_anio int default null, p_semana int default null)
returns table(gravedad text, casos bigint)
language sql stable as $$
  select gravedad, count(*) as casos
  from atenciones
  where tipo_registro = p_tipo_registro
    and (p_anio is null or extract(isoyear from fecha)::int = p_anio)
    and (p_semana is null or extract(week from fecha)::int = p_semana)
  group by gravedad;
$$;

-- Sigue existiendo para el ranking "Top responsables" del Dashboard (no se
-- quitó, solo dejó de graficarse como barras apiladas: ver casos_por_zona_gravedad).
create function casos_por_responsable_gravedad(p_tipo_registro text, p_anio int default null, p_semana int default null)
returns table(responsable text, gravedad text, casos bigint)
language sql stable as $$
  select responsable_nombre as responsable, gravedad, count(*) as casos
  from atenciones
  where tipo_registro = p_tipo_registro
    and (p_anio is null or extract(isoyear from fecha)::int = p_anio)
    and (p_semana is null or extract(week from fecha)::int = p_semana)
  group by responsable_nombre, gravedad
  order by responsable_nombre, gravedad;
$$;

-- Nuevo: reemplaza al gráfico de barras "Responsable × gravedad" por
-- "Gravedad por Zona".
create function casos_por_zona_gravedad(p_tipo_registro text, p_anio int default null, p_semana int default null)
returns table(zona text, gravedad text, casos bigint)
language sql stable as $$
  select zona, gravedad, count(*) as casos
  from atenciones
  where tipo_registro = p_tipo_registro
    and (p_anio is null or extract(isoyear from fecha)::int = p_anio)
    and (p_semana is null or extract(week from fecha)::int = p_semana)
  group by zona, gravedad
  order by zona;
$$;

create function casos_por_estado(p_tipo_registro text, p_anio int default null, p_semana int default null)
returns table(estado text, casos bigint)
language sql stable as $$
  select estado, count(*) as casos
  from atenciones
  where tipo_registro = p_tipo_registro
    and (p_anio is null or extract(isoyear from fecha)::int = p_anio)
    and (p_semana is null or extract(week from fecha)::int = p_semana)
  group by estado;
$$;
