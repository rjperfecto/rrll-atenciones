-- Corrige el alcance de "Firmas de personal" (migración 0041): no es la
-- firma de trabajadores de TAREO (legajo), es la firma de los USUARIOS de
-- la plataforma (profiles) — se usa para firmar con la firma del propio
-- responsable los documentos que genera en Herramientas > Documento, no
-- para firmar en nombre del trabajador destinatario del documento. El
-- módulo recién se había shippeado (0041) sin firmas reales cargadas
-- todavía, así que se recrea la tabla en vez de migrar datos.

delete from storage.objects where bucket_id = 'firmas-personal';
drop table if exists firmas_personal;

create table firmas_personal (
  usuario_id uuid primary key references profiles(id) on delete cascade,
  storage_path text not null,
  creado_por uuid not null references profiles(id),
  creado_por_nombre text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table firmas_personal enable row level security;

-- Mismas políticas que 0041: lectura para cualquier autenticado (Documento
-- Individual/Masivo necesitan poder leer la firma del responsable logueado,
-- sea quien sea), solo ADMIN sube/reemplaza/borra. Las políticas del bucket
-- de Storage (firmas-personal) ya existen desde 0041 y no cambian.
create policy "firmas_personal_select" on firmas_personal for select to authenticated using (true);
create policy "firmas_personal_write" on firmas_personal for all to authenticated using (is_admin()) with check (is_admin());
