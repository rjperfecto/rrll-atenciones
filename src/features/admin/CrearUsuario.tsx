import { useState, type FormEvent } from 'react'
import { AlertCircle, CheckCircle2, UserPlus } from 'lucide-react'
import { ZONAS, type Zona } from '@/data/zonasFundos'
import { crearUsuario } from '@/lib/personalZonaApi'
import { PageHeader } from '@/components/ui/PageHeader'
import { CardSection } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import type { Rol } from '@/types'

const ROLES: Rol[] = ['CAMPO', 'SUPERVISOR', 'ADMIN']

// Administración > Crear usuario: crea la cuenta (auth + profile) vía la
// Edge Function crear-usuario (ver src/lib/personalZonaApi.ts) — no se puede
// hacer directo desde el navegador porque requiere la service_role key.
export function CrearUsuario() {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [rol, setRol] = useState<Rol>('CAMPO')
  const [zonaAsignada, setZonaAsignada] = useState<Zona | ''>('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMensaje(null)
    if (!usuario.trim() || !password.trim() || !nombreCompleto.trim()) {
      setError('Usuario, contraseña y nombre completo son obligatorios.')
      return
    }
    setGuardando(true)
    const { error: err } = await crearUsuario({
      usuario: usuario.trim(),
      password: password.trim(),
      nombreCompleto: nombreCompleto.trim().toUpperCase(),
      rol,
      zonaAsignada: zonaAsignada || null,
    })
    setGuardando(false)
    if (err) {
      setError(err)
      return
    }
    setMensaje(`Usuario creado: ${usuario.trim()} (rol ${rol}${zonaAsignada ? `, zona ${zonaAsignada}` : ''}).`)
    setUsuario('')
    setPassword('')
    setNombreCompleto('')
    setRol('CAMPO')
    setZonaAsignada('')
  }

  return (
    <div className="max-w-xl">
      <PageHeader
        title="Crear usuario"
        description="Crea una cuenta nueva del sistema. El usuario ingresa con el nombre de usuario (no el email completo) — se completa @hortifrut.com automáticamente."
      />

      <CardSection title="Datos de la cuenta" icon={<UserPlus className="size-4 text-brand" />}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Usuario">
            <input
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="jperez"
              required
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="input"
            />
          </Field>

          <Field label="Contraseña">
            <input
              type="text"
              placeholder="su DNI"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </Field>

          <Field label="Nombre completo">
            <input
              type="text"
              placeholder="JUAN PÉREZ LÓPEZ"
              required
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              className="input"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Rol">
              <select value={rol} onChange={(e) => setRol(e.target.value as Rol)} className="input">
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Zona asignada (opcional)">
              <select value={zonaAsignada} onChange={(e) => setZonaAsignada(e.target.value as Zona | '')} className="input">
                <option value="">Sin zona fija</option>
                {ZONAS.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <p className="text-xs text-neutral-400 -mt-2">
            SUPERVISOR ve/administra/elimina todo lo de su zona; con Zona asignada (cualquier rol), lo que registre
            queda siempre en esa zona.
          </p>

          {error && (
            <p className="text-sm text-red-600 flex items-center gap-1.5">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </p>
          )}
          {mensaje && (
            <div className="rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-3 py-2 flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0" />
              {mensaje}
            </div>
          )}

          <Button type="submit" loading={guardando}>
            {guardando ? 'Creando...' : 'Crear usuario'}
          </Button>
        </form>
      </CardSection>
    </div>
  )
}
