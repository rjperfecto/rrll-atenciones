-- Cantidad de personas actuales por grupo (ver 360 Laboral > Próximas
-- caminatas, tablero de zonas): el grupo más reciente de cada trabajador
-- (no atado a una fecha fija, a diferencia de v_grupo_fundo_actual que ya
-- existía), contado por grupo.
create view v_grupo_cantidad_personas as
  select grupo, count(*) as personas
  from (
    select distinct on (legajo) legajo, grupo
    from trabajadores_historial
    order by legajo, fecha desc
  ) t
  where grupo is not null and grupo <> ''
  group by grupo;
