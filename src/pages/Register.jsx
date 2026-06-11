import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import BrandLogo from '../components/menu/BrandLogo'
import { Loader2, KeyRound, Mail, AlertCircle, Building2, Globe } from 'lucide-react'

export function Register() {
  const { user, register, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [restaurantName, setRestaurantName] = useState('')
  const [subdomain, setSubdomain] = useState('')
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
    if (!restaurantName || !subdomain || !email || !password) {
      setError('Por favor, preencha todos os campos.')
      return
    }

    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(subdomain)) {
      setError('Subdomínio inválido. Use apenas letras minúsculas, números e hífens.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await register(restaurantName, subdomain, email, password)
      navigate('/admin', { replace: true })
    } catch (err) {
      console.error('Erro no cadastro:', err)
      setError(err.message || 'Erro ao criar conta. Verifique os dados e tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  // Auto-generate subdomain from restaurant name
  const handleRestaurantNameChange = (e) => {
    const name = e.target.value
    setRestaurantName(name)
    
    // Auto-fill subdomain if the user hasn't typed anything custom yet or if it matches the previous auto-generation
    if (name) {
      const suggestedSubdomain = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9-]/g, '-') // Replace non-alphanumeric with hyphen
        .replace(/-+/g, '-') // Remove multiple hyphens
        .replace(/^-|-$/g, '') // Remove hyphen from start and end
      
      setSubdomain(suggestedSubdomain)
    } else {
      setSubdomain('')
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
            Crie seu Cardápio
          </h1>
          <p className="text-xs text-gold font-ui tracking-widest uppercase mt-1">
            Plataforma Multitenant
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-3 bg-red-950/50 border border-red-900 rounded-admin flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-red-200 leading-relaxed">{error}</p>
          </div>
        )}

        {/* Form register */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Nome do Restaurante
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={restaurantName}
                onChange={handleRestaurantNameChange}
                disabled={submitting || authLoading}
                placeholder="Ex: Don Fernando"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-admin text-white text-sm focus:outline-none focus:border-gold transition-colors placeholder:text-slate-600 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Subdomínio (Link do Cardápio)
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                disabled={submitting || authLoading}
                placeholder="don-fernando"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-admin text-white text-sm focus:outline-none focus:border-gold transition-colors placeholder:text-slate-600 disabled:opacity-50"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Seu link será: <span className="text-gold">{subdomain || 'seurestaurante'}</span>.localhost</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              E-mail de Acesso
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting || authLoading}
                placeholder="seuemail@exemplo.com"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-admin text-white text-sm focus:outline-none focus:border-gold transition-colors placeholder:text-slate-600 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Senha
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
            className="w-full py-3 mt-4 bg-navy hover:bg-navy-mid text-white font-ui font-semibold rounded-admin text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            style={{ border: '1px solid rgba(201,168,76,0.2)' }}
          >
            {submitting || authLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Criando conta...
              </>
            ) : (
              'Criar Cardápio'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500 font-ui">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-gold hover:text-ivory transition-colors">
              Fazer login
            </Link>
          </p>
        </div>
      </div>

    </div>
  )
}

export default Register
