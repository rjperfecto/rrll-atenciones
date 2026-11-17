-- Administración > Textos de cartas 360: permite editar desde la app la
-- redacción de los párrafos/títulos fijos de la Carta de compromisos y la
-- Carta de verificación de 360 Laboral (ver src/data/textosCartas360.ts y
-- src/features/admin/TextosCartas360.tsx). Una sola fila por documento;
-- "textos" solo trae los campos que el admin personalizó, el resto sigue
-- usando el texto por defecto del código.

create table textos_cartas_360 (
  documento text primary key check (documento in ('COMPROMISOS', 'VERIFICACION')),
  textos jsonb not null default '{}'::jsonb,
  actualizado_por uuid not null references profiles(id),
  actualizado_por_nombre text not null,
  updated_at timestamptz not null default now()
);

alter table textos_cartas_360 enable row level security;

-- Lectura para cualquier autenticado (cualquiera que registre una caminata
-- o verifique compromisos genera estas cartas, no solo un admin); solo
-- ADMIN edita la redacción.
create policy "textos_cartas_360_select" on textos_cartas_360 for select to authenticated using (true);
create policy "textos_cartas_360_write" on textos_cartas_360 for all to authenticated using (is_admin()) with check (is_admin());
