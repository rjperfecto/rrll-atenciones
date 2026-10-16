-- Lista de nombres para el selector "Responsable" de Agenda (ver
-- CapacitacionModal): profiles tiene RLS que solo deja ver la fila propia a
-- quien no es ADMIN (migración 0002), así que un select directo no sirve
-- para un combo que debe ver cualquier usuario. Esta vista, sin
-- security_invoker (a propósito, como v_casos_por_semana antes de la
-- migración 0015), corre con los permisos de quien la creó y no los de
-- quien consulta, así que ignora esa RLS — pero solo expone id y nombre,
-- nunca email/rol/zona_asignada.
create view v_personal_nombres as
  select id, nombre_completo from profiles where activo = true order by nombre_completo;
