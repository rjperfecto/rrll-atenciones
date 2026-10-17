-- "Próximas caminatas" (Compromisos > 360 Laboral): programar a futuro un
-- grupo + fecha para una caminata 360, sin duplicar datos de TAREO — Zona,
-- Fundo y Líder se derivan en vivo desde trabajadores_historial por
-- Grupo+Fecha al mostrar la lista (ver buscarGrupoCompleto en
-- busquedaApi.ts), no se guardan acá.
--
-- Es solo un recordatorio (no se conecta automáticamente con el registro
-- real): el botón "Cerrar" de cada fila lleva a Registrar caminata con el
-- grupo y la fecha precargados (?grupo=...&fecha=...) y borra la
-- programación, como si ya se hubiese cumplido.

create table caminatas_programadas (
  id uuid primary key default gen_random_uuid(),
  grupo text not null,
  fecha date not null,
  creado_por uuid not null references profiles(id),
  creado_por_nombre text not null,
  created_at timestamptz not null default now()
);

create index caminatas_programadas_fecha_idx on caminatas_programadas (fecha);

alter table caminatas_programadas enable row level security;

create policy "caminatas_programadas_select" on caminatas_programadas for select to authenticated using (true);
create policy "caminatas_programadas_insert" on caminatas_programadas for insert to authenticated
  with check (creado_por = auth.uid());
create policy "caminatas_programadas_delete" on caminatas_programadas for delete to authenticated
  using (creado_por = auth.uid() or is_admin());
