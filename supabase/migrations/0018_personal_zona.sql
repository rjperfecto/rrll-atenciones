-- Asignación fija de personal a una zona (Administración > Personal por
-- zona): si un legajo está acá, su Zona en Atenciones/360 Laboral se fuerza
-- siempre a esta, sin importar en qué fundo/zona aparezca trabajando ese día
-- según TAREO (ver src/lib/personalZonaApi.ts y su uso en FormularioGeneral/
-- RegistrarCaminata).
create table personal_zona (
  legajo text primary key,
  nombre_completo text not null,
  zona text not null,
  updated_at timestamptz not null default now()
);

alter table personal_zona enable row level security;

create policy "personal_zona_select" on personal_zona for select to authenticated using (true);
create policy "personal_zona_write" on personal_zona for all to authenticated
  using (is_admin()) with check (is_admin());
