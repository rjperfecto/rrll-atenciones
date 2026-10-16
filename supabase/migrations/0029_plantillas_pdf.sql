-- Plantillas PDF: un PDF ya armado (ej. una carta/declaración) al que se le
-- superponen Nombre completo, DNI, Celular y Fecha para un trabajador
-- puntual. Se sube una vez (Administración > Plantillas PDF, solo ADMIN),
-- se configuran las posiciones de cada campo con clicks sobre una vista
-- previa, y después cualquier usuario puede generarla para cualquier
-- trabajador (buscado por legajo) cuantas veces quiera — ver
-- src/features/herramientas/GenerarDocumento.tsx.
--
-- Por ahora solo soporta la página 1 del PDF (ver pagina en "posiciones"):
-- alcanza para cartas/declaraciones de una sola hoja, que es el caso de uso
-- pedido. Si hace falta más de una página, se puede extender después.

create table plantillas_pdf (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  storage_path text not null,
  -- posiciones: [{ campo: 'nombre'|'dni'|'celular'|'fecha', pagina: number,
  -- x: number, y: number, tamano: number }], en puntos PDF (72 dpi, origen
  -- abajo a la izquierda). Vacío hasta que alguien las configura.
  posiciones jsonb not null default '[]',
  creado_por uuid not null references profiles(id),
  creado_por_nombre text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table plantillas_pdf enable row level security;

create policy "plantillas_pdf_select" on plantillas_pdf for select to authenticated using (true);
create policy "plantillas_pdf_write" on plantillas_pdf for all to authenticated using (is_admin()) with check (is_admin());

-- Bucket privado: el PDF original puede tener membrete/datos internos, no
-- va servido público. Se accede vía URL firmada (ver plantillasApi.ts).
insert into storage.buckets (id, name, public) values ('plantillas-pdf', 'plantillas-pdf', false);

create policy "plantillas_pdf_storage_select" on storage.objects for select to authenticated
  using (bucket_id = 'plantillas-pdf');
create policy "plantillas_pdf_storage_write" on storage.objects for all to authenticated
  using (bucket_id = 'plantillas-pdf' and is_admin())
  with check (bucket_id = 'plantillas-pdf' and is_admin());
