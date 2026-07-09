-- Seguridad por fila: personal de CAMPO solo ve/edita sus propias atenciones;
-- ADMIN ve y edita todo. Los catálogos son de lectura pública (autenticado)
-- y solo ADMIN puede modificarlos.

alter table zonas enable row level security;
alter table fundos enable row level security;
alter table categorizacion_catalogo enable row level security;
alter table profiles enable row level security;
alter table atenciones enable row level security;

create function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and rol = 'ADMIN'
  );
$$;

-- Catálogos: lectura para cualquier autenticado, escritura solo admin.
create policy "catalogos_select" on zonas for select to authenticated using (true);
create policy "catalogos_write" on zonas for all to authenticated using (is_admin()) with check (is_admin());

create policy "fundos_select" on fundos for select to authenticated using (true);
create policy "fundos_write" on fundos for all to authenticated using (is_admin()) with check (is_admin());

create policy "categorizacion_select" on categorizacion_catalogo for select to authenticated using (true);
create policy "categorizacion_write" on categorizacion_catalogo for all to authenticated using (is_admin()) with check (is_admin());

-- Profiles: cada quien ve/edita el propio; admin ve todos.
create policy "profiles_select_own_or_admin" on profiles for select to authenticated
  using (id = auth.uid() or is_admin());
create policy "profiles_update_own_or_admin" on profiles for update to authenticated
  using (id = auth.uid() or is_admin());

-- Atenciones: campo solo ve/crea/edita las propias; admin, todas.
create policy "atenciones_select" on atenciones for select to authenticated
  using (responsable_id = auth.uid() or is_admin());
create policy "atenciones_insert" on atenciones for insert to authenticated
  with check (responsable_id = auth.uid() or is_admin());
create policy "atenciones_update" on atenciones for update to authenticated
  using (responsable_id = auth.uid() or is_admin());
