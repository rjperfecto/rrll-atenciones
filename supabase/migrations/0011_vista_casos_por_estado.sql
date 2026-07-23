-- Vista para las tarjetas KPI del Dashboard (total / abiertos / en proceso /
-- cerrados): igual que el resto de vistas de reportes, agrega en el servidor
-- en vez de traer todas las atenciones al navegador. security_invoker desde
-- el inicio (ver 0010_fix_rls_vistas_reportes.sql) para que respete RLS.

create view v_casos_por_estado as
  select estado, count(*) as casos
  from atenciones
  group by estado;

alter view v_casos_por_estado set (security_invoker = true);
