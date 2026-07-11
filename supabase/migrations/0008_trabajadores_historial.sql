-- Reemplaza la tabla "trabajadores" (un solo registro "actual" por legajo)
-- por un historial diario: un registro por cada combinación Legajo+Fecha.
-- Esto permite que "Nueva atención" busque el dato del trabajador tal como
-- estaba EN LA FECHA del caso (no siempre el más reciente cargado).

create table trabajadores_historial (
  legajo text not null,
  fecha date not null,
  dni text not null,
  nombre_completo text not null,
  area text,
  fundo text,
  grupo text,
  sup_cuadrilla text,
  updated_at timestamptz not null default now(),
  primary key (legajo, fecha)
);

create index trabajadores_historial_legajo_idx on trabajadores_historial (legajo);

alter table trabajadores_historial enable row level security;

create policy "trabajadores_historial_select" on trabajadores_historial for select to authenticated using (true);
create policy "trabajadores_historial_write" on trabajadores_historial for all to authenticated
  using (is_admin()) with check (is_admin());

drop table if exists trabajadores;
