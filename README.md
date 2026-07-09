# RRLL Atenciones — Hortifrut Perú

App de registro de atenciones en campo del equipo de Relaciones Laborales, reemplazando el
Excel `ATENCIONES RRLL-2025.xlsx`. PWA instalable, funciona offline y sincroniza con Supabase
cuando hay conexión.

## Stack

React + Vite + TypeScript · Tailwind CSS · Supabase (Postgres, Auth) · Dexie.js (IndexedDB
offline) · vite-plugin-pwa · React Hook Form + Zod · Recharts.

## Puesta en marcha

```bash
npm install
npm run dev
```

Sin configurar Supabase, la pantalla de login ofrece un **modo demo** (guarda todo localmente
en el navegador) para poder probar el formulario, el historial y el dashboard de inmediato.

### Conectar Supabase (para uso real, multiusuario y con sync)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En el **SQL Editor** del proyecto, ejecuta en orden los archivos de `supabase/migrations/`:
   `0001_init_schema.sql` → `0002_rls_policies.sql` → `0003_seed_catalogos.sql` → `0004_views_reportes.sql`.
3. Copia `.env.example` a `.env` y completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
   (Project Settings → API).
4. Crea los usuarios del equipo (Authentication → Users → Add user). El trigger de la
   migración 0001 les crea automáticamente su `profile` con rol `CAMPO`; para dar rol `ADMIN`
   (ve todo el historial y el dashboard), actualiza la columna `rol` en la tabla `profiles`
   desde el Table Editor.
5. Reinicia `npm run dev`.

## Qué reemplaza del Excel

- **BASE DE DATOS** → tabla `atenciones` + formulario "Nueva atención" con cascada
  Tipo → Categoría → Subcategoría y gravedad autocalculada (ver `src/data/categorizacion.ts`,
  que reemplaza los VLOOKUP rotos de la hoja CATEGORIZACIÓN).
- **FUNDO** (85 variantes de texto libre por typos) → catálogo cerrado de 12 fundos
  canónicos en `src/data/zonasFundos.ts`. El sublote/anexo (ej. "ARM 1-H") no se modela por
  ahora; se puede agregar como campo propio si el equipo lo necesita.
- **GRUPO** (616 variantes) → queda como texto libre en el MVP; limpiarlo a catálogo es
  trabajo de la fase de importación histórica (ver más abajo).
- **INDICADOR** (tablas dinámicas semana/zona/gravedad/responsable) → pestaña Dashboard
  (solo rol ADMIN) + vistas SQL en `0004_views_reportes.sql`.

## Pendiente (no incluido en este scaffold inicial)

- **Importación de las ~3277 filas históricas** del Excel: requiere limpiar FUNDO/GRUPO con
  fuzzy-matching contra los catálogos y cargarlas a `atenciones` con `origen='LEGACY_EXCEL'`.
- **Pantallas admin** para editar catálogos (fundos, categorización) sin tocar SQL.
- Subir usuarios reales del equipo de RRLL a Supabase Auth (hoy solo existe el modo demo local).

## Estructura

```
src/
  features/auth/        login + contexto de sesión (con modo demo)
  features/atenciones/  formulario, lista/historial, schema de validación
  features/dashboard/   gráficos (reemplaza hoja INDICADOR)
  data/                 catálogos de negocio (tipos/categorías/gravedad, zonas/fundos)
  lib/                  db.ts (Dexie), supabaseClient.ts, sync.ts (outbox offline)
supabase/migrations/    schema, RLS, seed de catálogos, vistas de reportes
```
