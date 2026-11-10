-- Verificación de compromisos de 360 Laboral: cada ronda de verificación
-- (carta de verificación + firma de recepción del trabajador, ver
-- VerificarCompromisosModal y cartaVerificacion360.ts) se guarda como un
-- registro nuevo de tipo_registro '360 LABORAL' (reutiliza toda la lista/
-- filtros/exportación/RLS existente), no como una edición del caso
-- original — así se arma una línea de tiempo por grupo: la caminata
-- original y cada ronda de verificación posterior, todas enlazadas a la
-- misma raíz.
alter table atenciones add column caminata_origen_id uuid references atenciones(id) on delete set null;
create index atenciones_caminata_origen_idx on atenciones (caminata_origen_id);
