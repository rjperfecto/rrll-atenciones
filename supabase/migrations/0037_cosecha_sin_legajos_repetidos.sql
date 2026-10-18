-- No hacía falta (trabajadores_historial tiene primary key (legajo, fecha),
-- así que para una sola fecha cada legajo aparece una única vez — count(*)
-- ya no podía duplicar a nadie), pero se deja explícito con count(distinct
-- legajo) para que quede documentado en el propio SQL, no solo en la
-- cabeza de quien lo escribió.
create or replace view v_grupo_cosecha_actual as
  select grupo, max(fundo) as fundo, count(distinct legajo) as personas
  from trabajadores_historial
  where fecha = (select max(fecha) from trabajadores_historial)
    and grupo is not null and grupo <> ''
    and fundo is not null and fundo <> ''
    and fundo like '%-_%'
    and upper(coalesce(area, '')) like '%COSECHA%'
  group by grupo;
