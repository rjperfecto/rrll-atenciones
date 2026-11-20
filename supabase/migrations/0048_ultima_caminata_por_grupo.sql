-- Agrega la fecha de la última caminata a v_caminatas_por_grupo (migración
-- 0031), para el tablero de 360 Laboral > Próximas caminatas. Mismo motivo
-- que el conteo "caminatas": sin security_invoker, para que sea la fecha
-- real del equipo, no limitada por la RLS de "atenciones" (responsable_id/
-- zona) de quien consulta.
create or replace view v_caminatas_por_grupo as
  select grupo, count(*) as caminatas, max(fecha) as ultima_fecha
  from atenciones
  where tipo_registro = '360 LABORAL' and grupo is not null
  group by grupo;
