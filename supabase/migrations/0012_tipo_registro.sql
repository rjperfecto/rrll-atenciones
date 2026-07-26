-- Nueva clasificación del registro (independiente de TIPO/CATEGORIA/
-- SUBCATEGORIA): por ahora las 3 opciones comparten los mismos campos, pero
-- a futuro cada una tendrá columnas propias. Se agrega con default 'GENERAL'
-- para que las atenciones ya existentes queden clasificadas ahí.

alter table atenciones
  add column tipo_registro text not null default 'GENERAL'
  check (tipo_registro in ('GENERAL', 'COSECHA', '360 LABORAL'));

create index atenciones_tipo_registro_idx on atenciones (tipo_registro);
