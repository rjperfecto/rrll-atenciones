-- Recategoriza las alertas de "360 Laboral": pasan de un checkbox plano
-- (alertas_360) a una taxonomía Categoría -> Subcategoría -> Nivel, con la
-- cantidad de personal que reportó cada una. "Alcance" (antes autocompletado
-- con el tamaño del grupo) pasa a ser "Total de personal encuestado", de
-- carga 100% manual.
--
-- alertas_360 y detalle_alerta NO se eliminan: los registros creados antes
-- de este cambio siguen mostrándose con ellos (ver DetalleAtencionModal y
-- exportXlsx, que hacen fallback a alertas_360 cuando alertas_reportadas
-- está vacío). El formulario nuevo deja de escribir en alertas_360.

alter table atenciones
  add column if not exists alertas_reportadas jsonb not null default '[]';

alter table atenciones
  rename column alcance to total_encuestado;
