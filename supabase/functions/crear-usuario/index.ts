// Crea un usuario nuevo (auth.users + profiles) desde Administración > Crear
// usuario. Existe como Edge Function porque crear cuentas requiere la
// service_role key, que nunca puede viajar al navegador — este función corre
// en el servidor de Supabase, no en el cliente.
//
// Seguridad: primero valida que quien llama esté autenticado y sea ADMIN
// (usando su propio token, respetando RLS), recién ahí usa el cliente con
// service_role para crear la cuenta.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const DOMINIO_EMAIL = 'hortifrut.com'
const ROLES_VALIDOS = ['CAMPO', 'ADMIN', 'SUPERVISOR']

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'No autorizado.' }, 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Cliente "como quien llama": para confirmar quién es y que sea ADMIN,
  // respetando RLS (profiles_select_own_or_admin permite ver el propio perfil).
  const clienteLlamador = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: userError } = await clienteLlamador.auth.getUser()
  if (userError || !userData.user) return json({ error: 'No autorizado.' }, 401)

  const { data: perfilLlamador } = await clienteLlamador.from('profiles').select('rol').eq('id', userData.user.id).single()
  if (perfilLlamador?.rol !== 'ADMIN') {
    return json({ error: 'Solo un administrador puede crear usuarios.' }, 403)
  }

  let body: { usuario?: string; password?: string; nombreCompleto?: string; rol?: string; zonaAsignada?: string | null }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Cuerpo de la petición inválido.' }, 400)
  }

  const usuario = (body.usuario ?? '').trim()
  const password = (body.password ?? '').trim()
  const nombreCompleto = (body.nombreCompleto ?? '').trim()
  const rol = body.rol ?? 'CAMPO'
  const zonaAsignada = body.zonaAsignada || null

  if (!usuario || !password || !nombreCompleto) {
    return json({ error: 'Usuario, contraseña y nombre completo son obligatorios.' }, 400)
  }
  if (!ROLES_VALIDOS.includes(rol)) {
    return json({ error: `Rol inválido: ${rol}.` }, 400)
  }

  const email = usuario.includes('@') ? usuario : `${usuario}@${DOMINIO_EMAIL}`
  const admin = createClient(supabaseUrl, serviceKey)

  const { data: creado, error: crearError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre_completo: nombreCompleto },
  })
  if (crearError || !creado.user) {
    return json({ error: crearError?.message ?? 'No se pudo crear el usuario.' }, 400)
  }

  // El trigger handle_new_user (migración 0001) ya creó el profile con rol
  // CAMPO por defecto; acá se ajusta al rol/zona pedidos.
  const { error: updateError } = await admin
    .from('profiles')
    .update({ rol, zona_asignada: zonaAsignada })
    .eq('id', creado.user.id)
  if (updateError) {
    return json({ error: `Usuario creado pero no se pudo asignar rol/zona: ${updateError.message}` }, 500)
  }

  return json({ id: creado.user.id, email })
})
