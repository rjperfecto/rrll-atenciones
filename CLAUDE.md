# Instrucciones del proyecto

- Cuando el usuario pida terminar/aplicar un cambio, comitea y pushea a `origin/main` automáticamente sin pedir confirmación antes de cada push (instrucción explícita del usuario, 2026-10-17). Igual sigue las reglas generales de Git (commits nuevos en vez de amend, sin --no-verify, etc.) y nunca hace force-push.
- Las migraciones de Supabase (`supabase/migrations/*.sql`) no se aplican solas: después de cada commit con una migración nueva, pasale el SQL al usuario para que lo corra a mano en el SQL Editor de Supabase.
