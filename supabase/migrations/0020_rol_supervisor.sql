-- Nuevo rol SUPERVISOR: ve, administra (cierra/edita) y puede ELIMINAR todas
-- las atenciones/caminatas 360 de su zona asignada (zona_asignada en
-- profiles), sin importar quién las creó, pero sin acceso a las pantallas
-- globales de Administración ni a otras zonas (eso se controla en el front,
-- ver App.tsx). ADMIN sigue viendo/pudiendo todo, sin restricción de zona.
-- CAMPO no cambia: solo ve/edita lo propio.
alter table profiles drop constraint profiles_rol_check;
alter table profiles add constraint profiles_rol_check check (rol in ('CAMPO', 'ADMIN', 'SUPERVISOR'));

-- security definer (como is_admin()): null si el que llama no es SUPERVISOR
-- o no tiene zona asignada, así que "zona = zona_supervisor()" nunca es true
-- para ellos.
create function public.zona_supervisor()
returns text
language sql
security definer set search_path = public
stable
as $$
  select zona_asignada from profiles where id = auth.uid() and rol = 'SUPERVISOR';
$$;

drop policy "atenciones_select" on atenciones;
create policy "atenciones_select" on atenciones for select to authenticated
  using (responsable_id = auth.uid() or is_admin() or zona = zona_supervisor());

drop policy "atenciones_update" on atenciones;
create policy "atenciones_update" on atenciones for update to authenticated
  using (responsable_id = auth.uid() or is_admin() or zona = zona_supervisor());

-- No existía policy de delete: nadie podía borrar atenciones desde el
-- cliente hasta ahora.
create policy "atenciones_delete" on atenciones for delete to authenticated
  using (is_admin() or zona = zona_supervisor());
