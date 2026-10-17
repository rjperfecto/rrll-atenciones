-- Importar conflictividad (Administración, solo ADMIN): nivel de
-- conflictividad por grupo de cosecha, usado en 360 Laboral > Próximas
-- caminatas para priorizar qué grupos visitar primero. Cada carga
-- reemplaza todo (igual que Importar personal), no se acumula historial.

create table conflictividad_grupos (
  grupo text primary key,
  valor numeric not null,
  nivel text not null check (nivel in ('BAJO', 'MEDIO', 'ALTO')),
  updated_at timestamptz not null default now()
);

alter table conflictividad_grupos enable row level security;

create policy "conflictividad_grupos_select" on conflictividad_grupos for select to authenticated using (true);
create policy "conflictividad_grupos_write" on conflictividad_grupos for all to authenticated
  using (is_admin()) with check (is_admin());

-- Zona/Fundo actual de cada grupo (fila más reciente en trabajadores_historial),
-- para el tablero de Próximas caminatas.
create view v_grupo_fundo_actual as
  select distinct on (grupo) grupo, fundo
  from trabajadores_historial
  where grupo is not null and grupo <> ''
  order by grupo, fecha desc;

-- Cantidad de caminatas 360 Laboral ya registradas por grupo (informativo,
-- Próximas caminatas). Sin security_invoker a propósito: el conteo debe ser
-- el total real del equipo, no limitado por la RLS de "atenciones"
-- (responsable_id/zona) de quien consulta.
create view v_caminatas_por_grupo as
  select grupo, count(*) as caminatas
  from atenciones
  where tipo_registro = '360 LABORAL' and grupo is not null
  group by grupo;
