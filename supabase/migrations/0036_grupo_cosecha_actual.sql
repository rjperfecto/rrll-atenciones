-- Dashboard > Resumen: "personal de cosecha" (y los grupos que cuentan como
-- tales) se define con el criterio exacto pedido — no alcanza con "no es
-- soporte" (migración 0034, que seguía sumando áreas que no son cosecha):
--   - ACTIVIDAD (columna area) debe contener la palabra COSECHA.
--   - La columna MODULO (el sufijo de FUNDO después del último guion, ej.
--     "REM 2-W" -> "W") no debe estar vacía.
-- Una sola vista con grupo + fundo + personas (antes eran dos separadas,
-- v_grupo_fundo_actual y v_grupo_personas_cosecha): evita que un grupo
-- quede contado si no tiene NINGÚN trabajador que cumpla el criterio.
create view v_grupo_cosecha_actual as
  select grupo, max(fundo) as fundo, count(*) as personas
  from trabajadores_historial
  where fecha = (select max(fecha) from trabajadores_historial)
    and grupo is not null and grupo <> ''
    and fundo is not null and fundo <> ''
    and fundo like '%-_%'
    and upper(coalesce(area, '')) like '%COSECHA%'
  group by grupo;
