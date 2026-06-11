import React, { useEffect } from 'react'
import { useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login', { replace: true })
      } else if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redireciona para um fallback se não tiver a role necessária
        navigate('/admin', { replace: true })
      }
    }
  }, [user, loading, navigate, allowedRoles])

  if (loading) {
    return (
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: 'var(--navy-dark)',
          color: 'var(--gold)',
          fontFamily: 'var(--font-ui)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          fontSize: '11px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div 
            style={{
              width: '40px',
              height: '40px',
              border: '2px solid var(--gold-pale)',
              borderTop: '2px solid var(--gold)',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 1s linear infinite',
            }}
          />
          Carregando Painel...
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    )
  }

  // Se temos um usuário, checa as roles antes de renderizar
  if (user) {
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return null // Ou pode retornar uma UI de "Acesso Negado"
    }
    return children ? children : <Outlet />
  }
  
  return null
}
export default ProtectedRoute
