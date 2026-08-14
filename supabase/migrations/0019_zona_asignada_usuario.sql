-- Corrige el alcance de "Personal por zona" (Administración): NO es una
-- asignación por trabajador/legajo (personal_zona, migración 0018, nunca se
-- llegó a usar) — es una asignación por USUARIO del sistema (cvalencia,
-- jvillena, etc.). El admin fija la zona de cada usuario, y esa zona se
-- fuerza siempre en lo que ese usuario registra en Atenciones/360 Laboral,
-- sin importar en qué fundo/zona aparezca el trabajador involucrado ese día.
drop table if exists personal_zona;

alter table profiles add column if not exists zona_asignada text;
