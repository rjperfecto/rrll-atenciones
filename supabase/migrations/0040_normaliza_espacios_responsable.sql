-- La migración 0038 normalizó mayúsculas de responsable_nombre, pero no
-- espacios. Un nombre con doble espacio o espacio al final (ej. perfil creado
-- a mano en Supabase Auth, ver comentario en AtencionForm.tsx) se ve igual en
-- pantalla pero es un texto distinto para el GROUP BY de los RPC "Top
-- responsables" / "por responsable" — la misma persona aparece 2 veces en el
-- ranking con el conteo partido en vez de sumado (reportado: Ruby Valdiviezo
-- y Graciela Rodríguez duplicadas, 360 Laboral de la semana 44 "no sumaba").

-- 1) Fix de datos existentes (una sola vez), igual que 0038.
update atenciones
set responsable_nombre = trim(regexp_replace(responsable_nombre, '\s+', ' ', 'g'))
where responsable_nombre != trim(regexp_replace(responsable_nombre, '\s+', ' ', 'g'));

update profiles
set nombre_completo = trim(regexp_replace(nombre_completo, '\s+', ' ', 'g'))
where nombre_completo != trim(regexp_replace(nombre_completo, '\s+', ' ', 'g'));

-- 2) Defensivo hacia adelante: los RPC de ranking normalizan espacios al
-- agrupar, por si vuelve a guardarse un nombre con espacios raros (mismo
-- espíritu que el .toUpperCase() "defensivo" ya existente en el código).
create or replace function casos_por_responsable_gravedad(p_tipos_registro text[], p_anio int default null, p_semana int default null, p_area text default null)
returns table(responsable text, gravedad text, casos bigint)
language sql stable as $$
  select trim(regexp_replace(responsable_nombre, '\s+', ' ', 'g')) as responsable, gravedad, count(*) as casos
  from atenciones
  where tipo_registro = any(p_tipos_registro)
    and (p_anio is null or extract(isoyear from fecha)::int = p_anio)
    and (p_semana is null or extract(week from fecha)::int = p_semana)
    and (p_area is null or area = p_area)
  group by 1, gravedad
  order by 1, gravedad;
$$;

create or replace function casos_por_responsable_semanas(
  p_tipos_registro text[], p_anio int default null, p_semanas int[] default null, p_area text default null
)
returns table(responsable text, casos bigint)
language sql stable as $$
  select trim(regexp_replace(responsable_nombre, '\s+', ' ', 'g')) as responsable, count(*) as casos
  from atenciones
  where tipo_registro = any(p_tipos_registro)
    and (p_anio is null or extract(isoyear from fecha)::int = p_anio)
    and (p_semanas is null or extract(week from fecha)::int = any(p_semanas))
    and (p_area is null or area = p_area)
  group by 1
  order by casos desc;
$$;
