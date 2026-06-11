import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import BrandLogo from '../components/menu/BrandLogo'
import { Loader2, Mail, AlertCircle, CheckCircle } from 'lucide-react'

export function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      setError('Por favor, informe seu e-mail.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      })
      setSuccess(true)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Erro ao processar solicitação.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-admin p-8 relative z-10 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="p-1 border border-gold rounded-full mb-3 bg-navy-dark">
            <BrandLogo size={60} borderColor="var(--gold)" />
          </div>
          <h1 className="text-xl font-display font-semibold text-ivory tracking-wide text-center">
            Recuperação de Senha
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-950/50 border border-red-900 rounded-admin flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-red-200 leading-relaxed">{error}</p>
          </div>
        )}

        {success ? (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <p className="text-sm text-slate-300">
              Se o e-mail existir em nossa base, enviamos um link de recuperação para <span className="font-semibold text-white">{email}</span>.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 mt-4 bg-navy hover:bg-navy-mid text-white font-ui font-semibold rounded-admin text-xs uppercase tracking-widest transition-colors shadow-lg"
              style={{ border: '1px solid rgba(201,168,76,0.2)' }}
            >
              Voltar ao Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Seu E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  placeholder="admin@restaurante.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-admin text-white text-sm focus:outline-none focus:border-gold transition-colors placeholder:text-slate-600 disabled:opacity-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 mt-2 bg-navy hover:bg-navy-mid text-white font-ui font-semibold rounded-admin text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              style={{ border: '1px solid rgba(201,168,76,0.2)' }}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Link'
              )}
            </button>
          </form>
        )}

        {!success && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-xs text-slate-500 hover:text-gold transition-colors font-ui tracking-wider uppercase bg-transparent border-0 cursor-pointer"
            >
              ← Voltar ao Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword
