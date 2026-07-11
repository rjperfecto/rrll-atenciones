import { useState, type FormEvent } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useAuth } from './AuthContext'
import { isSupabaseConfigured } from '@/lib/supabaseClient'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

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
          <Card className="mb-6 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium mb-1 flex items-center gap-1.5">
              <AlertTriangle className="size-4" />
              Supabase aún no está configurado
            </p>
            <p className="mb-3">
              Agrega tus credenciales en <code className="bg-amber-100 px-1 rounded">.env</code> para
              usar login real. Mientras tanto puedes probar la app en modo demo.
            </p>
            <input
              type="text"
              placeholder="Tu nombre"
              value={nombreDemo}
              onChange={(e) => setNombreDemo(e.target.value)}
              className="w-full rounded-md border border-amber-300 px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <Button
              type="button"
              onClick={() => signInDemo(nombreDemo)}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              Entrar en modo demo
            </Button>
          </Card>
        )}

        <Card className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Contraseña">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn('input', error && 'input-error')}
              />
            </Field>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" loading={loading} className="w-full">
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
