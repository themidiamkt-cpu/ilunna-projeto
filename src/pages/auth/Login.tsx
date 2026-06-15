import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Flame, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

function Login() {
  const { signIn } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginForm) {
    setAuthError(null)
    const { error } = await signIn(data.email, data.password)
    if (error) {
      setAuthError('E-mail ou senha incorretos. Verifique suas credenciais.')
    }
  }

  return (
    <div className="min-h-screen bg-ilunna-cream flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-ilunna-terracotta/5" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-ilunna-gold/5" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-ilunna-brown/10 border border-ilunna-light overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-10 pb-8 text-center bg-gradient-to-b from-ilunna-light/50 to-transparent border-b border-ilunna-light">
            <div className="w-14 h-14 bg-ilunna-terracotta rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-ilunna-terracotta/30">
              <Flame className="w-7 h-7 text-white" />
            </div>
            <h1 className="font-display text-3xl font-semibold text-ilunna-dark">
              Ilunna
            </h1>
            <p className="text-sm text-ilunna-muted mt-1.5 tracking-wide">
              Sistema de Gestão
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Auth error */}
              {authError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  {authError}
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-ilunna-dark font-medium">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  className={cn(errors.email && 'border-red-400 focus-visible:ring-red-400')}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-ilunna-dark font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={cn(
                      'pr-10',
                      errors.password && 'border-red-400 focus-visible:ring-red-400'
                    )}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ilunna-muted hover:text-ilunna-dark transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full bg-ilunna-terracotta hover:bg-ilunna-brown text-white font-medium h-11 mt-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Entrando...
                  </span>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-ilunna-muted mt-6">
          Ilunna Aromas Artesanais &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}

export default Login
