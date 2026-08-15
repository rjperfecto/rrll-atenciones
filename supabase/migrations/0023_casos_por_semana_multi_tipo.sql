-- v_casos_por_semana agrupaba también por tipo_registro, así que con la
-- fusión de Dashboards (0022, TODOS = GENERAL+COSECHA) devolvía una fila
-- por tipo por semana en vez de un total combinado. La reemplaza una
-- función que agrupa solo por año/semana, sumando los tipos pedidos.
drop view v_casos_por_semana;

create function casos_por_semana(p_tipos_registro text[])
returns table(anio int, semana int, casos bigint)
language sql stable as $$
  select extract(isoyear from fecha)::int as anio, extract(week from fecha)::int as semana, count(*) as casos
  from atenciones
  where tipo_registro = any(p_tipos_registro)
  group by 1, 2
  order by 1, 2;
$$;
