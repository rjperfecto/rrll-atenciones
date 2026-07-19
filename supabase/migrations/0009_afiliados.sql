-- Lista de afiliados sindicales (Excel "AFILIADOS", columna CONTINGENCIA:
-- AFILIADO / EXAFILIADO / DESAFILIADO). Se guarda solo el estado derivado
-- (es_afiliado boolean): AFILIADO -> true, EXAFILIADO/DESAFILIADO -> false.
-- Es informativo y de solo lectura desde "Nueva atención": el legajo que no
-- aparece en la lista se considera no afiliado.

create table afiliados (
  legajo text primary key,
  nombre_completo text not null,
  es_afiliado boolean not null,
  updated_at timestamptz not null default now()
);

alter table afiliados enable row level security;

create policy "afiliados_select" on afiliados for select to authenticated using (true);
create policy "afiliados_write" on afiliados for all to authenticated
  using (is_admin()) with check (is_admin());
