-- Firmas de personal (Administración > Firmas de personal, solo ADMIN): una
-- imagen de firma por trabajador (clave = legajo), subida una sola vez, para
-- usarla automáticamente al generar documentos en Herramientas > Documento
-- (individual o masivo) sin tener que firmar en campo cada vez — ver
-- src/features/admin/FirmasPersonal.tsx y el uso en DocumentoIndividual/
-- DocumentoMasivo.tsx. Igual patrón que plantillas_pdf (migración 0029).

create table firmas_personal (
  legajo text primary key,
  storage_path text not null,
  creado_por uuid not null references profiles(id),
  creado_por_nombre text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table firmas_personal enable row level security;

-- Lectura para cualquier autenticado (Documento Individual/Masivo la
-- necesitan para cualquiera que genere el PDF, no solo ADMIN); solo ADMIN
-- sube/reemplaza/borra.
create policy "firmas_personal_select" on firmas_personal for select to authenticated using (true);
create policy "firmas_personal_write" on firmas_personal for all to authenticated using (is_admin()) with check (is_admin());

-- Bucket privado (igual que plantillas-pdf/documentos-firmados): se accede
-- por el cliente autenticado, no servido público.
insert into storage.buckets (id, name, public) values ('firmas-personal', 'firmas-personal', false);

create policy "firmas_personal_storage_select" on storage.objects for select to authenticated
  using (bucket_id = 'firmas-personal');
create policy "firmas_personal_storage_write" on storage.objects for all to authenticated
  using (bucket_id = 'firmas-personal' and is_admin())
  with check (bucket_id = 'firmas-personal' and is_admin());
