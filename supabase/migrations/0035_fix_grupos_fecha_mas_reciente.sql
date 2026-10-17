-- Corrige v_grupo_fundo_actual / v_grupo_cantidad_personas /
-- v_grupo_personas_cosecha: usaban "la fecha más reciente que tuvo CADA
-- grupo (o cada legajo)" por separado (distinct on), lo que dejaba
-- "grupos fantasma" de días viejos sumados a los de hoy — si una
-- importación trae varios días y un grupo se renombró o se disolvió a
-- mitad de semana, el código viejo se seguía contando aparte del nuevo
-- (de ahí que apareciera más grupos y más personal de los reales).
--
-- Ahora las tres usan la MISMA fecha para todas las filas: la más reciente
-- que haya en toda la tabla (la última foto real de TAREO cargada), así
-- "grupos/personal de hoy" es literalmente ese día, no una mezcla de
-- fechas distintas por grupo o por trabajador.

create or replace view v_grupo_fundo_actual as
  select distinct on (grupo) grupo, fundo
  from trabajadores_historial
  where fecha = (select max(fecha) from trabajadores_historial)
    and grupo is not null and grupo <> ''
  order by grupo, fundo;

create or replace view v_grupo_cantidad_personas as
  select grupo, count(*) as personas
  from trabajadores_historial
  where fecha = (select max(fecha) from trabajadores_historial)
    and grupo is not null and grupo <> ''
  group by grupo;

create or replace view v_grupo_personas_cosecha as
  select grupo, count(*) as personas
  from trabajadores_historial
  where fecha = (select max(fecha) from trabajadores_historial)
    and grupo is not null and grupo <> ''
    and (area is null or upper(area) not like '%SOPORTE%')
  group by grupo;
