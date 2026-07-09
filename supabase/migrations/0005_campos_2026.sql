-- Campos nuevos detectados en el Excel "ATENCIONES 2026-ACTUAL": las hojas
-- ZONA 1/2/3 y PACKING traen más detalle por caso que el modelo original
-- (LEGAJO ya vive dentro del jsonb "involucrados", el resto son columnas nuevas).

alter table atenciones
  add column if not exists fecha_cierre date,
  add column if not exists modulo text,
  add column if not exists area text,
  add column if not exists falta text,
  add column if not exists accion_correctiva text,
  add column if not exists dias_suspension smallint,
  add column if not exists sup_cuadrilla text,
  add column if not exists sup_rrll text,
  add column if not exists reporte text,
  add column if not exists antecedente text,
  add column if not exists notas_seguimiento text;
