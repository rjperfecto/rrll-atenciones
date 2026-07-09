-- Esquema inicial: reemplaza el Excel "ATENCIONES RRLL-2025.xlsx".
-- Ver src/data/categorizacion.ts y src/data/zonasFundos.ts para el catálogo
-- de negocio ya depurado (85 variantes de FUNDO -> 12 fundos canónicos, etc).

create extension if not exists pgcrypto;

create table zonas (
  id uuid primary key default gen_random_uuid(),
  nombre text unique not null,
  orden smallint not null
);

create table fundos (
  id uuid primary key default gen_random_uuid(),
  nombre text unique not null,
  zona_id uuid references zonas(id), -- nullable: el Excel no vincula fundo->zona de forma confiable, se asigna después desde admin
  activo boolean not null default true
);

-- Catálogo maestro TIPO -> CATEGORIA -> SUBCATEGORIA -> GRAVEDAD (hoja "CATEGORIZACIÓN").
-- Hoy la app lo trae embebido en src/data/categorizacion.ts; esta tabla existe
-- para que a futuro se pueda editar desde una pantalla admin sin re-desplegar la app.
create table categorizacion_catalogo (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('CONSULTA','INTERVENCIÓN','RECLAMO','COORDINACIÓN','SOLICITUD','PREVENTIVO')),
  categoria text not null,
  subcategoria text not null,
  gravedad text not null check (gravedad in ('BAJO','MEDIO','ALTO')),
  activo boolean not null default true,
  unique (tipo, categoria, subcategoria)
);

-- Espejo de auth.users con el rol de la app.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre_completo text not null,
  email text not null,
  rol text not null default 'CAMPO' check (rol in ('CAMPO','ADMIN')),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Trigger: crea el profile automáticamente cuando alguien se registra en auth.users.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, nombre_completo, rol)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nombre_completo', new.email), 'CAMPO');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Caso / atención de campo. involucrados va como jsonb (simplificación del
-- MVP): el volumen y los reportes actuales son a nivel de caso, no de
-- trabajador individual. Si más adelante se necesita analizar reincidencia
-- por DNI, se puede normalizar a una tabla aparte sin romper esta.
create table atenciones (
  id uuid primary key default gen_random_uuid(),
  client_uuid uuid not null unique, -- generado en el dispositivo; evita duplicados al reintentar el sync
  fecha date not null,
  zona text not null,
  fundo text,
  grupo text,
  tipo text not null,
  categoria text not null,
  subcategoria text not null,
  gravedad text not null check (gravedad in ('BAJO','MEDIO','ALTO')), -- copiado del catálogo al crear (snapshot inmutable)
  comentarios text,
  involucrados jsonb not null default '[]',
  cantidad_involucrados smallint not null default 1,
  estado text not null default 'ABIERTO' check (estado in ('ABIERTO','EN_PROCESO','CERRADO')),
  detalle_cierre text,
  responsable_id uuid not null references profiles(id),
  responsable_nombre text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index atenciones_fecha_idx on atenciones (fecha);
create index atenciones_zona_idx on atenciones (zona);
create index atenciones_responsable_idx on atenciones (responsable_id);
create index atenciones_estado_idx on atenciones (estado);
create index atenciones_involucrados_dni_idx on atenciones using gin (involucrados);
