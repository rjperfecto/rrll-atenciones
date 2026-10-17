-- Dashboard > Resumen: el personal contado por zona debe ser solo de
-- cosecha (cosechadores), sin soportes — misma exclusión que ya usa
-- buscarGrupoCompleto en el cliente (area ilike '%SOPORTE%'). Vista aparte
-- de v_grupo_cantidad_personas (que sigue sin filtrar, la usa el tablero de
-- conflictividad de Próximas caminatas y ese sí cuenta a todos).
create view v_grupo_personas_cosecha as
  select grupo, count(*) as personas
  from (
    select distinct on (legajo) legajo, grupo, area
    from trabajadores_historial
    order by legajo, fecha desc
  ) t
  where grupo is not null and grupo <> ''
    and (area is null or upper(area) not like '%SOPORTE%')
  group by grupo;
