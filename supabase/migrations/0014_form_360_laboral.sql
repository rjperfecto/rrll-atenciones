-- Formulario "360 Laboral": registro de sesión/grupo (conversatorio,
-- seguimiento, compromiso), no de un trabajador individual. No usa la
-- Matriz Tipo/Categoría/Subcategoría (se relajan a nullable) ni el
-- involucrado por legajo (involucrados queda '[]' para estos registros).

alter table atenciones
  alter column tipo drop not null,
  alter column categoria drop not null,
  alter column subcategoria drop not null;

alter table atenciones
  add column if not exists sede text check (sede in ('PACKING','FUNDO')),
  add column if not exists packing_sede text check (packing_sede in ('PACKING SALAVERRY','PACKING CHAO')),
  add column if not exists turno text check (turno in ('DIA','NOCHE')),
  add column if not exists lider_cosecha text,
  add column if not exists alcance integer,
  add column if not exists tipo_atencion_360 text[],
  add column if not exists alertas_360 text[],
  add column if not exists detalle_alerta text,
  add column if not exists compromiso_generado boolean,
  add column if not exists detalle_compromiso text,
  add column if not exists fecha_fin_compromiso date,
  add column if not exists evidencia_360 text;
