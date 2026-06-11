import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import BrandLogo from '../components/menu/BrandLogo'
import { Loader2, KeyRound, Mail, AlertCircle } from 'lucide-react'
import { getTenantSlug } from '../lib/tenant'
import { useQuery } from '@tanstack/react-query'

const API_BASE_URL = 'http://localhost:3000/api'

export default function LoginTenant() {
  const { user, signIn, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const slug = getTenantSlug()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Fetch tenant info
  const { data: tenantInfo, isLoading: loadingTenant } = useQuery({
    queryKey: ['tenant', slug],
    queryFn: async () => {
      if (!slug) return null
      const res = await fetch(`${API_BASE_URL}/tenants/by-slug/${slug}`)
      if (!res.ok) {
        throw new Error('Tenant não encontrado ou suspenso')
      }
      return res.json()
    },
    enabled: !!slug,
    retry: false
  })

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

    setSubmitting(true)
    setError(null)

    try {
      await signIn(email.trim(), password)
      navigate('/admin', { replace: true })
    } catch (err) {
      console.error('Erro de login:', err)
      setError(err.message || 'Credenciais inválidas. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingTenant) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    )
  }

  if (!tenantInfo && slug) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-admin p-8 text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-white text-lg font-bold mb-2">Loja Indisponível</h2>
          <p className="text-slate-400 text-sm">Não conseguimos localizar o cadastro desta loja ou ela encontra-se suspensa.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      {/* Visual background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-admin p-8 relative z-10 shadow-2xl">
        {/* Branding header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-1 border border-gold rounded-full mb-3 bg-navy-dark overflow-hidden w-20 h-20 flex items-center justify-center">
            {tenantInfo?.logo_url ? (
              <img src={tenantInfo.logo_url} alt="Logo" className="w-full h-full object-cover rounded-full" />
            ) : (
              <BrandLogo size={50} borderColor="var(--gold)" />
            )}
          </div>
          <h1 className="text-xl font-display font-semibold text-ivory tracking-wide text-center">
            Acesso Restrito
          </h1>
          <p className="text-xs text-gold font-ui tracking-widest uppercase mt-1">
            {tenantInfo?.name || 'Administração'}
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
                placeholder="seu@email.com"
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
            className="w-full bg-gold hover:bg-gold-light text-navy-dark font-bold text-sm py-3 px-4 rounded-admin transition-all flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-lg mt-2"
          >
            {submitting || authLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Entrar no Painel'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
