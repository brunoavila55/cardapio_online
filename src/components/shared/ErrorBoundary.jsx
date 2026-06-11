import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturou um erro:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white border border-red-200 rounded-lg p-6 max-w-md w-full shadow-sm text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">Ops, algo deu errado!</h2>
            <p className="text-slate-600 text-sm mb-4">
              Ocorreu um erro inesperado na aplicação. Nossa equipe foi notificada (se logs estiverem ativos).
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-navy text-white px-4 py-2 rounded text-sm font-semibold hover:bg-navy-mid transition-colors"
            >
              Recarregar página
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
