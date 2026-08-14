import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, MapPinned } from 'lucide-react'
import { ZONAS, type Zona } from '@/data/zonasFundos'
import { listarUsuarios, asignarZonaUsuario } from '@/lib/personalZonaApi'
import { PageHeader } from '@/components/ui/PageHeader'
import { CardSection } from '@/components/ui/Card'
import type { Profile } from '@/types'

// Administración > Personal por zona: fija la Zona de un USUARIO del
// sistema (cvalencia, jvillena, etc.). Si un usuario tiene zona asignada,
// todo lo que registre en Atenciones/360 Laboral se guarda con esa zona,
// sin importar el fundo/zona del trabajador involucrado ese día (ver
// FormularioGeneral/AtencionForm/RegistrarCaminata).
export function PersonalPorZona() {
  const [usuarios, setUsuarios] = useState<Profile[] | null>(null)
  const [guardandoId, setGuardandoId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  useEffect(() => {
    void listarUsuarios().then(setUsuarios)
  }, [])

  async function cambiarZona(usuario: Profile, zona: string) {
    setError(null)
    setMensaje(null)
    setGuardandoId(usuario.id)
    const { error: err } = await asignarZonaUsuario(usuario.id, zona || null)
    setGuardandoId(null)
    if (err) {
      setError(err)
      return
    }
    setUsuarios((prev) => prev?.map((u) => (u.id === usuario.id ? { ...u, zona_asignada: zona || null } : u)) ?? null)
    setMensaje(zona ? `${usuario.nombre_completo} ahora registra siempre en ${zona}.` : `${usuario.nombre_completo} ya no tiene zona fija.`)
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Personal por zona"
        description="Fija la Zona de cada usuario del sistema: si un usuario tiene zona asignada, todo lo que registre en Atenciones y 360 Laboral queda siempre en esa zona, sin importar el fundo donde aparezca trabajando el involucrado ese día."
      />

      <CardSection title="Usuarios" icon={<MapPinned className="size-4 text-brand" />}>
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

        {usuarios === null ? (
          <p className="text-sm text-neutral-400">Cargando...</p>
        ) : (
          <div className="divide-y divide-neutral-100">
            {usuarios.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-800 truncate">{u.nombre_completo}</p>
                  <p className="text-xs text-neutral-400 truncate">
                    {u.email} · <span className="font-medium">{u.rol}</span>
                  </p>
                </div>
                <select
                  value={u.zona_asignada ?? ''}
                  disabled={guardandoId === u.id}
                  onChange={(e) => cambiarZona(u, e.target.value)}
                  className="input w-auto min-w-[10rem] shrink-0"
                >
                  <option value="">Sin zona fija</option>
                  {ZONAS.map((z: Zona) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </CardSection>
    </div>
  )
}
