-- Las vistas de reportes (0004_views_reportes.sql) las creó el rol "postgres",
-- que tiene BYPASSRLS: por default una vista corre con los privilegios de su
-- dueño, así que estas vistas ignoraban por completo las políticas RLS de
-- "atenciones" y exponían los datos de TODOS los responsables a cualquier
-- usuario autenticado (incluido CAMPO), sin importar sus propias atenciones.
-- security_invoker hace que la vista se ejecute con los permisos de quien
-- consulta, para que las políticas RLS de "atenciones" se respeten normalmente.

alter view v_casos_por_semana set (security_invoker = true);
alter view v_casos_por_zona set (security_invoker = true);
alter view v_casos_por_gravedad set (security_invoker = true);
alter view v_responsable_x_gravedad set (security_invoker = true);
