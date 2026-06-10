import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import BrandLogo from '../components/menu/BrandLogo'
import { Loader2, KeyRound, Mail, AlertCircle } from 'lucide-react'

export function Login() {
  const { user, signIn, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Redirect to admin panel if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/admin', { replace: true })
    }
  }, [user, authLoading, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.')
      return
    }

    // Automatically append default domain if user typed a simple username
    let finalEmail = email.trim()
    if (!finalEmail.includes('@')) {
      finalEmail = `${finalEmail}@admin.com`
    }

    setSubmitting(true)
    setError(null)

    try {
      await signIn(finalEmail, password)
      navigate('/admin', { replace: true })
    } catch (err) {
      console.error('Erro de login:', err)
      setError(err.message || 'Credenciais inválidas. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      {/* Visual background elements reminiscent of Art Deco lines */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-admin p-8 relative z-10 shadow-2xl">
        {/* Branding header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-1 border border-gold rounded-full mb-3 bg-navy-dark">
            <BrandLogo size={60} borderColor="var(--gold)" />
          </div>
          <h1 className="text-xl font-display font-semibold text-ivory tracking-wide">
            Administração do Cardápio
          </h1>
          <p className="text-xs text-gold font-ui tracking-widest uppercase mt-1">
            {import.meta.env.VITE_RESTAURANT_NAME || 'Restaurante Principal'}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-3 bg-red-950/50 border border-red-900 rounded-admin flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-red-200 leading-relaxed">{error}</p>
          </div>
        )}

        {/* Form login */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Usuário ou E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting || authLoading}
                placeholder="Ex: administrador"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-admin text-white text-sm focus:outline-none focus:border-gold transition-colors placeholder:text-slate-600 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Senha de Acesso
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting || authLoading}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-admin text-white text-sm focus:outline-none focus:border-gold transition-colors placeholder:text-slate-600 disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || authLoading}
            className="w-full py-3 mt-2 bg-navy hover:bg-navy-mid text-white font-ui font-semibold rounded-admin text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            style={{ border: '1px solid rgba(201,168,76,0.2)' }}
          >
            {submitting || authLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Autenticando...
              </>
            ) : (
              'Entrar no Sistema'
            )}
          </button>
        </form>
      </div>

      {/* Back button to public menu */}
      <button
        onClick={() => navigate('/')}
        className="mt-6 text-xs text-slate-500 hover:text-gold transition-colors font-ui tracking-wider uppercase bg-transparent border-0 cursor-pointer"
      >
        ← Voltar para o Cardápio Público
      </button>
    </div>
  )
}

export default Login
