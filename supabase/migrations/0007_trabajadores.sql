-- Maestro de personal: permite autocompletar "Nueva atención" por Legajo
-- (nombre, área, fundo, zona, grupo, sup. cuadrilla) en vez de tipearlo cada vez.
-- Se carga desde un Excel vía la pantalla admin (Importar personal) y se
-- actualiza por upsert (nunca se borra un legajo por ausencia en una carga nueva).

create table trabajadores (
  legajo text primary key,
  dni text not null,
  nombre_completo text not null,
  area text,
  fundo text,
  zona text,
  grupo text,
  sup_cuadrilla text,
  updated_at timestamptz not null default now()
);

alter table trabajadores enable row level security;

create policy "trabajadores_select" on trabajadores for select to authenticated using (true);
create policy "trabajadores_write" on trabajadores for all to authenticated
  using (is_admin()) with check (is_admin());
