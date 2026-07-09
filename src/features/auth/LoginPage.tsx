import { useState, type FormEvent } from 'react'
import { useAuth } from './AuthContext'
import { isSupabaseConfigured } from '@/lib/supabaseClient'

export function LoginPage() {
  const { signIn, signInDemo } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombreDemo, setNombreDemo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const err = await signIn(email, password)
    if (err) setError(err)
    setLoading(false)
  }

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-brand">RRLL Atenciones</h1>
          <p className="text-sm text-neutral-500 mt-1">Hortifrut Perú</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium mb-1">Supabase aún no está configurado</p>
            <p className="mb-3">
              Agrega tus credenciales en <code className="bg-amber-100 px-1 rounded">.env</code> para
              usar login real. Mientras tanto puedes probar la app en modo demo.
            </p>
            <input
              type="text"
              placeholder="Tu nombre"
              value={nombreDemo}
              onChange={(e) => setNombreDemo(e.target.value)}
              className="w-full rounded-md border border-amber-300 px-3 py-2 text-sm mb-2"
            />
            <button
              type="button"
              onClick={() => signInDemo(nombreDemo)}
              className="w-full rounded-md bg-amber-600 text-white py-2 text-sm font-medium hover:bg-amber-700"
            >
              Entrar en modo demo
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-brand text-white py-2 text-sm font-medium hover:bg-brand-light disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
