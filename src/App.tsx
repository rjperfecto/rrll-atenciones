import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom'
import {
  ClipboardPlus,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
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
import { cn } from '@/lib/cn'

function navClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
    isActive ? 'bg-brand/10 text-brand' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
  )
}

function AppLayout() {
  const { profile, signOut } = useAuth()
  const [online, setOnline] = useState(navigator.onLine)
  const [menuAbierto, setMenuAbierto] = useState(false)

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

  if (!profile) return <LoginPage />

  const cerrarMenu = () => setMenuAbierto(false)

  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setMenuAbierto(true)}
              aria-label="Abrir menú"
              className="p-2 -ml-2 rounded-md text-neutral-600 hover:bg-neutral-100 shrink-0"
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-semibold text-brand truncate">RRLL Atenciones</h1>
              <p className="text-xs text-neutral-500 truncate">{profile.nombre_completo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium',
                online ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-600',
              )}
            >
              {online ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
              <span className="hidden sm:inline">{online ? 'En línea' : 'Sin conexión'}</span>
            </span>
            <button
              onClick={signOut}
              className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {menuAbierto && (
        <div
          className="fixed inset-0 bg-black/40 z-30"
          onClick={cerrarMenu}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-72 max-w-[80vw] bg-white shadow-xl transition-transform duration-200 flex flex-col',
          menuAbierto ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
          <span className="text-sm font-semibold text-brand">Módulos</span>
          <button onClick={cerrarMenu} aria-label="Cerrar menú" className="p-1.5 rounded-md text-neutral-500 hover:bg-neutral-100">
            <X className="size-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <NavLink to="/" end className={navClass} onClick={cerrarMenu}>
            <ClipboardPlus className="size-4" />
            Nueva atención
          </NavLink>
          <NavLink to="/historial" className={navClass} onClick={cerrarMenu}>
            <History className="size-4" />
            Historial
          </NavLink>
          {profile.rol === 'ADMIN' && (
            <>
              <NavLink to="/dashboard" className={navClass} onClick={cerrarMenu}>
                <LayoutDashboard className="size-4" />
                Dashboard
              </NavLink>
              <NavLink to="/admin/personal" className={navClass} onClick={cerrarMenu}>
                <Users className="size-4" />
                Importar personal
              </NavLink>
              <NavLink to="/admin/afiliados" className={navClass} onClick={cerrarMenu}>
                <UserCheck className="size-4" />
                Importar afiliados
              </NavLink>
            </>
          )}
        </nav>
      </aside>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
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
