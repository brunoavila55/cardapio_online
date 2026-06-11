import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import BrandLogo from '../components/menu/BrandLogo'
import { Loader2, KeyRound, AlertCircle, CheckCircle } from 'lucide-react'

export function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Link de recuperação inválido ou ausente.')
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password || !confirmPassword) {
      setError('Por favor, preencha todos os campos.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword: password })
      })
      setSuccess(true)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Erro ao redefinir a senha.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!token && !error) {
    return <div className="min-h-screen bg-slate-950 flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>
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
            Redefinir Senha
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
              Sua senha foi alterada com sucesso!
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 mt-4 bg-navy hover:bg-navy-mid text-white font-ui font-semibold rounded-admin text-xs uppercase tracking-widest transition-colors shadow-lg"
              style={{ border: '1px solid rgba(201,168,76,0.2)' }}
            >
              Fazer Login
            </button>
          </div>
        ) : (
          token && !error?.includes('inválido ou ausente') && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Nova Senha
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-admin text-white text-sm focus:outline-none focus:border-gold transition-colors placeholder:text-slate-600 disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Confirme a Nova Senha
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={submitting}
                    placeholder="Repita a nova senha"
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
                    Salvando...
                  </>
                ) : (
                  'Redefinir Senha'
                )}
              </button>
            </form>
          )
        )}
      </div>
    </div>
  )
}

export default ResetPassword
