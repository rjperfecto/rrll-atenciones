import { useState, type FormEvent } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useAuth } from './AuthContext'
import { isSupabaseConfigured } from '@/lib/supabaseClient'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

export function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
            <p>
              Agrega tus credenciales en <code className="bg-amber-100 px-1 rounded">.env</code> para poder
              iniciar sesión — la app requiere conexión a Supabase para funcionar.
            </p>
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
