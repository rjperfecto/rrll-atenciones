import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/features/auth/AuthContext'
import { LoginPage } from '@/features/auth/LoginPage'
import { AtencionForm } from '@/features/atenciones/AtencionForm'
import { AtencionList } from '@/features/atenciones/AtencionList'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { setupAutoSync, pullRemotas } from '@/lib/sync'

function navClass({ isActive }: { isActive: boolean }) {
  return `py-2 border-b-2 ${isActive ? 'border-brand text-brand font-medium' : 'border-transparent text-neutral-500'}`
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

  useEffect(() => {
    if (!profile) return
    const cleanup = setupAutoSync(() => {})
    void pullRemotas(profile.id, profile.rol === 'ADMIN')
    return cleanup
  }, [profile])

  if (!profile) return <LoginPage />

  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-brand">RRLL Atenciones</h1>
            <p className="text-xs text-neutral-500">{profile.nombre_completo}</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-xs px-2 py-1 rounded-full ${online ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-600'}`}
            >
              {online ? 'En línea' : 'Sin conexión'}
            </span>
            <button onClick={signOut} className="text-sm text-neutral-500 hover:text-neutral-800">
              Salir
            </button>
          </div>
        </div>
        <nav className="max-w-4xl mx-auto px-4 flex gap-4 text-sm">
          <NavLink to="/" end className={navClass}>
            Nueva atención
          </NavLink>
          <NavLink to="/historial" className={navClass}>
            Historial
          </NavLink>
          {profile.rol === 'ADMIN' && (
            <NavLink to="/dashboard" className={navClass}>
              Dashboard
            </NavLink>
          )}
        </nav>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<AtencionForm />} />
          <Route path="/historial" element={<AtencionList />} />
          <Route path="/dashboard" element={profile.rol === 'ADMIN' ? <Dashboard /> : <Navigate to="/" />} />
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
