-- Directorio de teléfonos del personal (fuente: Excel "TELEFONOS", carga manual
-- vía script/admin, no vinculada a TAREO). Se cruza con trabajadores_historial
-- por legajo para la búsqueda de HERRAMIENTAS > Búsqueda (grupo completo / por
-- trabajador): nombre, grupo, líder y celulares de contacto.
create table telefonos (
  legajo text primary key,
  dni text not null,
  nombre_completo text not null,
  telefono_1 text,
  telefono_2 text,
  updated_at timestamptz not null default now()
);

alter table telefonos enable row level security;

create policy "telefonos_select" on telefonos for select to authenticated using (true);
create policy "telefonos_write" on telefonos for all to authenticated
  using (is_admin()) with check (is_admin());
