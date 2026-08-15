-- Corrige el alcance: ver todo lo de tu zona (Atenciones, 360 Laboral,
-- Dashboards) depende de tener zona_asignada, sin importar el ROL — un
-- CAMPO con zona asignada (ej. fcarmona en ZONA 1) también debe ver todo lo
-- de esa zona, no solo lo propio. Eliminar/administrar todo lo de la zona
-- sigue siendo exclusivo de SUPERVISOR/ADMIN (zona_supervisor(), sin
-- cambios, sigue usándose en atenciones_update/atenciones_delete).
create function public.zona_usuario()
returns text
language sql
security definer set search_path = public
stable
as $$
  select zona_asignada from profiles where id = auth.uid();
$$;

drop policy "atenciones_select" on atenciones;
create policy "atenciones_select" on atenciones for select to authenticated
  using (responsable_id = auth.uid() or is_admin() or zona = zona_usuario());
