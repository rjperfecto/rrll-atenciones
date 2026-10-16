-- Módulo "Agenda" (capacitaciones/reuniones): un calendario semanal
-- (Lunes a Sábado) de 7:00 a 17:00 en bloques de media hora, con color
-- elegido de una paleta fija (ver src/data/coloresAgenda.ts).
--
-- Visibilidad: TODOS los usuarios autenticados ven y pueden crear reuniones
-- (es una agenda compartida del equipo). Editar/borrar solo lo puede hacer
-- quien la creó (creado_por) o ADMIN — a diferencia de "atenciones", donde
-- además importa la zona; acá no hay zona, es la misma agenda para todos.

create table capacitaciones (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  hora_inicio time not null,
  hora_fin time not null,
  responsable text not null,
  tema text not null,
  ubicacion text not null,
  color text not null,
  creado_por uuid not null references profiles(id),
  creado_por_nombre text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint capacitaciones_horario_valido check (hora_fin > hora_inicio)
);

create index capacitaciones_fecha_idx on capacitaciones (fecha);

alter table capacitaciones enable row level security;

create policy "capacitaciones_select" on capacitaciones for select to authenticated using (true);

create policy "capacitaciones_insert" on capacitaciones for insert to authenticated
  with check (creado_por = auth.uid());

create policy "capacitaciones_update" on capacitaciones for update to authenticated
  using (creado_por = auth.uid() or is_admin());

create policy "capacitaciones_delete" on capacitaciones for delete to authenticated
  using (creado_por = auth.uid() or is_admin());
