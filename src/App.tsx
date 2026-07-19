import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { ClipboardPlus, History, LayoutDashboard, LogOut, UserCheck, Users, Wifi, WifiOff } from 'lucide-react'
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
    'flex items-center gap-1.5 px-1 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
    isActive ? 'border-brand text-brand' : 'border-transparent text-neutral-500 hover:text-neutral-800',
  )
}

function AppLayout() {
  const { profile, signOut } = useAuth()
  const [online, setOnline] = useState(navigator.onLine)

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

  if (!profile) return <LoginPage />

  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-semibold text-brand truncate">RRLL Atenciones</h1>
            <p className="text-xs text-neutral-500 truncate">{profile.nombre_completo}</p>
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
        <nav className="max-w-4xl mx-auto px-4 flex gap-5 text-sm overflow-x-auto">
          <NavLink to="/" end className={navClass}>
            <ClipboardPlus className="size-4" />
            Nueva atención
          </NavLink>
          <NavLink to="/historial" className={navClass}>
            <History className="size-4" />
            Historial
          </NavLink>
          {profile.rol === 'ADMIN' && (
            <>
              <NavLink to="/dashboard" className={navClass}>
                <LayoutDashboard className="size-4" />
                Dashboard
              </NavLink>
              <NavLink to="/admin/personal" className={navClass}>
                <Users className="size-4" />
                Importar personal
              </NavLink>
              <NavLink to="/admin/afiliados" className={navClass}>
                <UserCheck className="size-4" />
                Importar afiliados
              </NavLink>
            </>
          )}
        </nav>
      </header>

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
