-- Documento firmado por el líder al registrar una caminata 360 Laboral
-- (opcional, ver RegistrarCaminata.tsx): se genera una Plantilla PDF con los
-- datos del líder + su firma táctil, y se guarda acá — no es solo una
-- descarga como el resto de "Documento", queda enlazado al caso para poder
-- volver a verlo después.

alter table atenciones add column if not exists documento_firmado_path text;

-- Privado, igual que plantillas-pdf (puede tener membrete/datos internos):
-- se accede vía descarga autenticada (ver documentosFirmadosApi.ts), no
-- queda público.
insert into storage.buckets (id, name, public) values ('documentos-firmados', 'documentos-firmados', false);

create policy "documentos_firmados_storage_select" on storage.objects for select to authenticated
  using (bucket_id = 'documentos-firmados');
-- A diferencia de plantillas-pdf (solo ADMIN sube plantillas), acá
-- cualquier usuario autenticado puede subir: el documento firmado nace del
-- registro de SU PROPIA caminata, no de una pantalla de administración.
create policy "documentos_firmados_storage_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos-firmados');
