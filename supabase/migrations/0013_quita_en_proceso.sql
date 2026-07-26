-- EN_PROCESO nunca se usó: no había ninguna acción en la app que lo asignara
-- (un caso nace ABIERTO y el único cambio posible era cerrarlo). Se confirmó
-- que 0 filas lo tenían antes de aplicar esto, así que no hace falta migrar datos.

alter table atenciones drop constraint atenciones_estado_check;
alter table atenciones add constraint atenciones_estado_check check (estado in ('ABIERTO', 'CERRADO'));
