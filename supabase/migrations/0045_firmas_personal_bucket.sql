-- La migración 0041 crea el bucket de Storage "firmas-personal" junto con
-- la tabla firmas_personal, pero en este proyecto solo se corrió la tabla
-- (ver 0042, que la recrea sin tocar el bucket) — al subir una firma en
-- Administración > Firmas de personal, el bucket no existe y Storage
-- responde "Bucket not found". Esta migración es idempotente: no falla si
-- el bucket o las políticas ya existieran.

insert into storage.buckets (id, name, public)
values ('firmas-personal', 'firmas-personal', false)
on conflict (id) do nothing;

drop policy if exists "firmas_personal_storage_select" on storage.objects;
create policy "firmas_personal_storage_select" on storage.objects for select to authenticated
  using (bucket_id = 'firmas-personal');

drop policy if exists "firmas_personal_storage_write" on storage.objects;
create policy "firmas_personal_storage_write" on storage.objects for all to authenticated
  using (bucket_id = 'firmas-personal' and is_admin())
  with check (bucket_id = 'firmas-personal' and is_admin());
