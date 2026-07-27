import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import {
  Bell,
  ClipboardPlus,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  UserCheck,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import { AuthProvider, useAuth } from '@/features/auth/AuthContext'
import { LoginPage } from '@/features/auth/LoginPage'
import { AtencionForm } from '@/features/atenciones/AtencionForm'
import { AtencionList } from '@/features/atenciones/AtencionList'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { ImportarPersonal } from '@/features/admin/ImportarPersonal'
import { ImportarAfiliados } from '@/features/admin/ImportarAfiliados'
import { contarPendientes } from '@/lib/atencionesApi'
import { cn } from '@/lib/cn'

// Ítem de menú lateral estilo panel admin: activo = píldora lavanda con
// borde izquierdo morado y texto/ícono morado; inactivo = gris, hover sutil.
function navClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border-l-[3px]',
    isActive
      ? 'bg-sidebar-active text-brand border-brand'
      : 'text-neutral-500 border-transparent hover:bg-sidebar-hover hover:text-neutral-800',
  )
}

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/)
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase()
}

function GrupoNav({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{titulo}</p>
      {children}
    </div>
  )
}

function AppLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [online, setOnline] = useState(navigator.onLine)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [pendientes, setPendientes] = useState(0)

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  // Cierra el menú con Escape, y evita quedarse abierto al navegar entre rutas.
  useEffect(() => {
    if (!menuAbierto) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuAbierto(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuAbierto])

  // La campanita muestra un conteo real de pendientes (no un adorno): mismo
  // dato que la tarjeta "Pendientes" del Dashboard, consultado liviano
  // (count exacto sin traer filas) para no pesar en cada pantalla.
  useEffect(() => {
    if (!profile) return
    void contarPendientes(profile.id, profile.rol === 'ADMIN').then(setPendientes)
  }, [profile])

  if (!profile) return <LoginPage />

  const cerrarMenu = () => setMenuAbierto(false)

  function buscar(e: React.FormEvent) {
    e.preventDefault()
    const texto = busqueda.trim()
    if (!texto) return
    navigate(`/historial?q=${encodeURIComponent(texto)}`)
    cerrarMenu()
  }

  const nav = (
    <>
      <GrupoNav titulo="Principal">
        <NavLink to="/" end className={navClass} onClick={cerrarMenu}>
          <ClipboardPlus className="size-4" />
          Registrar
        </NavLink>
        <NavLink to="/historial" className={navClass} onClick={cerrarMenu}>
          <History className="size-4" />
          Atenciones
        </NavLink>
        {profile.rol === 'ADMIN' && (
          <NavLink to="/dashboard" className={navClass} onClick={cerrarMenu}>
            <LayoutDashboard className="size-4" />
            Dashboard
          </NavLink>
        )}
      </GrupoNav>
      {profile.rol === 'ADMIN' && (
        <GrupoNav titulo="Administración">
          <NavLink to="/admin/personal" className={navClass} onClick={cerrarMenu}>
            <Users className="size-4" />
            Importar personal
          </NavLink>
          <NavLink to="/admin/afiliados" className={navClass} onClick={cerrarMenu}>
            <UserCheck className="size-4" />
            Importar afiliados
          </NavLink>
        </GrupoNav>
      )}
    </>
  )

  return (
    <div className="min-h-full flex bg-cream">
      {menuAbierto && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={cerrarMenu} aria-hidden="true" />
      )}

      {/* Menú lateral: permanente en escritorio (md+), drawer deslizante en móvil. */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-72 bg-sidebar border-r border-neutral-100 shadow-xl md:shadow-none transition-transform duration-200 flex flex-col',
          'md:sticky md:top-0 md:h-screen md:translate-x-0',
          menuAbierto ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center size-9 rounded-xl bg-brand text-white font-bold text-sm shrink-0">RR</span>
            <span className="text-base font-bold text-neutral-800 tracking-tight">RRLL Atenciones</span>
          </div>
          <button onClick={cerrarMenu} aria-label="Cerrar menú" className="p-1.5 rounded-md text-neutral-400 hover:bg-neutral-100 md:hidden">
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">{nav}</nav>

        <div className="border-t border-neutral-100 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <span className="flex items-center justify-center size-9 rounded-full bg-brand text-white text-xs font-semibold shrink-0">
              {iniciales(profile.nombre_completo)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-neutral-800 truncate">{profile.nombre_completo}</p>
              <p className="text-xs text-neutral-400 truncate">{profile.email}</p>
            </div>
            <button onClick={signOut} aria-label="Salir" className="p-2 rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 shrink-0">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 border-b border-neutral-100 bg-white">
          <div className="px-4 sm:px-6 py-3 flex items-center gap-3">
            <button
              onClick={() => setMenuAbierto(true)}
              aria-label="Abrir menú"
              className="flex items-center justify-center size-10 rounded-md text-neutral-500 hover:bg-neutral-100 shrink-0 md:hidden"
            >
              <Menu className="size-5" />
            </button>

            <form onSubmit={buscar} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="size-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre, legajo, DNI..."
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand focus:bg-white transition-colors"
                />
              </div>
            </form>

            <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0">
              <span
                className={cn(
                  'hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold',
                  online ? 'bg-success-soft text-emerald-700' : 'bg-danger-soft text-red-700',
                )}
              >
                {online ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
                {online ? 'En línea' : 'Sin conexión'}
              </span>

              <button
                onClick={() => navigate('/historial?estado=ABIERTO')}
                aria-label={`${pendientes} casos pendientes`}
                className="relative flex items-center justify-center size-10 rounded-full text-neutral-500 hover:bg-neutral-100"
              >
                <Bell className="size-5" />
                {pendientes > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-secondary text-white text-[10px] font-bold">
                    {pendientes > 99 ? '99+' : pendientes}
                  </span>
                )}
              </button>

              <span className="flex items-center justify-center size-9 rounded-full bg-brand text-white text-xs font-semibold shrink-0">
                {iniciales(profile.nombre_completo)}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <Routes>
            <Route path="/" element={<AtencionForm />} />
            <Route path="/historial" element={<AtencionList />} />
            <Route path="/dashboard" element={profile.rol === 'ADMIN' ? <Dashboard /> : <Navigate to="/" />} />
            <Route
              path="/admin/personal"
              element={profile.rol === 'ADMIN' ? <ImportarPersonal /> : <Navigate to="/" />}
            />
            <Route
              path="/admin/afiliados"
              element={profile.rol === 'ADMIN' ? <ImportarAfiliados /> : <Navigate to="/" />}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
