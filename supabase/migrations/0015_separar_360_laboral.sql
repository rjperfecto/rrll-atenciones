-- Separa "360 Laboral" de Atenciones: ya no comparte columnas de Sede/
-- Packing/Turno (reutiliza zona/fundo/modulo, igual que Atenciones), y el
-- Compromiso pasa a tener su propio ciclo de vida (pendiente -> cerrado
-- con resultado_compromiso).

-- Importar personal: una sola tabla, cada carga reemplaza solo su sede.
alter table trabajadores_historial
  add column if not exists sede text not null default 'FUNDO' check (sede in ('FUNDO','PACKING'));

-- 360 Laboral ahora reutiliza zona/fundo/modulo en vez de columnas propias.
alter table atenciones
  drop column if exists sede,
  drop column if exists packing_sede,
  drop column if exists turno;

-- Resultado real de cómo se cerró el compromiso (Compromisos > Cerrar compromiso).
alter table atenciones add column if not exists resultado_compromiso text;

-- Alcance automático: cuenta legajos distintos cuyo registro de TAREO más
-- reciente (<= la fecha del caso) tiene ese grupo. Mismo patrón "más
-- reciente antes de la fecha" que buscarTrabajadorPorLegajo.
create or replace function contar_trabajadores_grupo(p_grupo text, p_fecha date)
returns bigint language sql stable as $$
  select count(*) from (
    select distinct on (legajo) grupo
    from trabajadores_historial
    where fecha <= p_fecha
    order by legajo, fecha desc
  ) t
  where grupo = p_grupo;
$$;

-- Las 5 vistas de reportes (0004/0010/0011) se recrean agregando
-- tipo_registro, para poder filtrar cada Dashboard por tipo sin traer todo
-- al cliente. (drop + create: security_invoker no sobrevive un DROP, se
-- reaplica después de cada create.)
drop view v_casos_por_semana;
create view v_casos_por_semana as
  select tipo_registro, extract(isoyear from fecha)::int as anio, extract(week from fecha)::int as semana, count(*) as casos
  from atenciones group by tipo_registro, 2, 3 order by 2, 3;
alter view v_casos_por_semana set (security_invoker = true);

drop view v_casos_por_zona;
create view v_casos_por_zona as
  select tipo_registro, zona, count(*) as casos,
    round(100.0 * count(*) / sum(count(*)) over (partition by tipo_registro), 1) as pct
  from atenciones group by tipo_registro, zona;
alter view v_casos_por_zona set (security_invoker = true);

drop view v_casos_por_gravedad;
create view v_casos_por_gravedad as
  select tipo_registro, gravedad, count(*) as casos from atenciones group by tipo_registro, gravedad;
alter view v_casos_por_gravedad set (security_invoker = true);

drop view v_responsable_x_gravedad;
create view v_responsable_x_gravedad as
  select tipo_registro, responsable_nombre as responsable, gravedad, count(*) as casos
  from atenciones group by tipo_registro, responsable_nombre, gravedad order by responsable_nombre, gravedad;
alter view v_responsable_x_gravedad set (security_invoker = true);

drop view v_casos_por_estado;
create view v_casos_por_estado as
  select tipo_registro, estado, count(*) as casos from atenciones group by tipo_registro, estado;
alter view v_casos_por_estado set (security_invoker = true);
