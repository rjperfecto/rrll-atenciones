-- Las cartas de 360 Laboral (compromisos/verificación) se firman con la
-- firma guardada del supervisor RRLL de la zona del caso (ver
-- supervisoresRrll.ts > buscarSupervisorRrllDeZona). Esa búsqueda la hace
-- cualquier usuario que registra una caminata o verifica compromisos, no
-- solo un admin, pero la política actual de profiles ("profiles_select_own_or_admin")
-- solo deja ver el propio perfil o, si eres admin, todos. Esta política
-- adicional (permisiva: se suma a la anterior, no la reemplaza) deja ver
-- además cualquier perfil con rol SUPERVISOR, que es información de
-- directorio (nombre/zona), no sensible.
create policy "profiles_select_supervisores" on profiles for select to authenticated
  using (rol = 'SUPERVISOR');
