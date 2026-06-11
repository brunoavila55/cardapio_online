import React from 'react'
import { useOnboarding } from '../../hooks/useOnboarding'
import { CheckCircle2, Circle, ChevronRight, PartyPopper } from 'lucide-react'

export function OnboardingChecklist({ onNavigate }) {
  const { onboarding, isLoading, markThemeCustomized, isMarkingTheme } = useOnboarding()

  if (isLoading || !onboarding) return null
  
  if (onboarding.is_completed) return null

  const steps = [
    {
      id: 'category',
      title: 'Crie sua primeira categoria',
      description: 'Agrupe seus pratos (Ex: Entradas, Bebidas).',
      isCompleted: onboarding.has_created_category,
      action: () => onNavigate('categories'),
      actionText: 'Ir para Categorias'
    },
    {
      id: 'product',
      title: 'Adicione seu primeiro prato',
      description: 'Cadastre um produto com nome, preço e foto.',
      isCompleted: onboarding.has_created_product,
      action: () => onNavigate('products'),
      actionText: 'Ir para Produtos'
    },
    {
      id: 'theme',
      title: 'Personalize o tema',
      description: 'Escolha a cor principal e o nome da sua loja.',
      isCompleted: onboarding.has_customized_theme,
      action: async () => {
        if (!onboarding.has_customized_theme) {
          await markThemeCustomized()
        }
        onNavigate('settings')
      },
      actionText: 'Ir para Configurações'
    }
  ]

  const completedCount = steps.filter(s => s.isCompleted).length
  const totalSteps = steps.length
  const progressPercent = Math.round((completedCount / totalSteps) * 100)

  return (
    <div className="bg-white border border-slate-200 rounded-admin p-6 shadow-sm mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gold/10 rounded-lg text-gold">
          <PartyPopper className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">Bem-vindo(a) ao seu novo painel!</h2>
          <p className="text-[11px] text-slate-500 font-medium">Siga os passos abaixo para deixar seu cardápio pronto para os clientes.</p>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
          <span>Progresso da configuração</span>
          <span className="text-navy">{progressPercent}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
          <div 
            className="h-full bg-navy rounded-full transition-all duration-700 ease-out" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((step, idx) => (
          <div 
            key={step.id} 
            className={`border rounded-lg p-4 flex flex-col justify-between transition-colors ${
              step.isCompleted 
                ? 'bg-slate-50 border-green-200 opacity-70' 
                : 'bg-white border-slate-200 shadow-sm hover:border-navy/30'
            }`}
          >
            <div>
              <div className="flex items-start gap-2.5 mb-2">
                {step.isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
                )}
                <div>
                  <h3 className={`text-xs font-bold ${step.isCompleted ? 'text-slate-600 line-through' : 'text-slate-800'}`}>
                    {step.title}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={step.action}
              disabled={step.isCompleted || isMarkingTheme}
              className={`mt-3 self-start text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors ${
                step.isCompleted 
                  ? 'text-green-600' 
                  : 'text-navy hover:text-navy-mid'
              }`}
            >
              {step.isCompleted ? 'Concluído' : step.actionText}
              {!step.isCompleted && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
