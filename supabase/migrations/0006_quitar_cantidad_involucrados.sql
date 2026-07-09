-- CANTIDAD INVOLUCRADOS se elimina por completo (campo y columna), según
-- el nuevo mapeo de columnas objetivo. No se pierden datos relevantes:
-- el detalle del trabajador involucrado sigue en la columna "involucrados" (jsonb).

alter table atenciones
  drop column if exists cantidad_involucrados;
