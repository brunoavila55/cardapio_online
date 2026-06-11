import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import BrandLogo from '../components/menu/BrandLogo'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Shield, Users, Store, Activity, AlertTriangle, ArrowRight, Play, Pause } from 'lucide-react'

export function SuperAdmin() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Queries
  const { data, isLoading, error } = useQuery({
    queryKey: ['superadmin-tenants'],
    queryFn: () => apiFetch('/superadmin/tenants')
  })

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => apiFetch(`/superadmin/tenants/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),
    onSuccess: () => queryClient.invalidateQueries(['superadmin-tenants'])
  })

  const impersonateMutation = useMutation({
    mutationFn: (tenantId) => apiFetch(`/superadmin/impersonate/${tenantId}`, {
      method: 'POST'
    }),
    onSuccess: (data) => {
      // Recebeu o token disfarçado. Substituir no localStorage
      localStorage.setItem('token', data.token)
      alert(`Você agora está logado como: ${data.tenant.name}`)
      // Força o reload da janela para limpar cache de React Query e states e recarregar como o tenant
      window.location.href = '/admin'
    },
    onError: (err) => {
      alert(`Erro na impersonação: ${err.message}`)
    }
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Activity className="w-8 h-8 text-navy animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-red-500 font-bold">Erro ao carregar dados do Super Admin</div>
      </div>
    )
  }

  const { metrics, tenants } = data

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-ui text-slate-800">
      {/* Top Navbar */}
      <header className="bg-navy-dark text-white px-6 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-red-600 rounded-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide font-display text-white">
              Painel Super Admin
            </h1>
            <p className="text-[10px] text-red-300 tracking-widest uppercase font-bold">
              Acesso Master
            </p>
          </div>
        </div>

        <button
          onClick={signOut}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-admin text-xs font-semibold transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair do Master
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Métricas Header */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 border border-slate-200 rounded-admin shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Store className="w-3.5 h-3.5" /> Total Lojas
            </div>
            <div className="text-2xl font-bold text-navy-dark">{metrics.total_tenants}</div>
          </div>
          <div className="bg-white p-4 border border-green-200 rounded-admin shadow-sm bg-green-50/30">
            <div className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> Ativas
            </div>
            <div className="text-2xl font-bold text-green-700">{metrics.active_tenants}</div>
          </div>
          <div className="bg-white p-4 border border-blue-200 rounded-admin shadow-sm bg-blue-50/30">
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Em Trial
            </div>
            <div className="text-2xl font-bold text-blue-700">{metrics.trial_tenants}</div>
          </div>
          <div className="bg-white p-4 border border-red-200 rounded-admin shadow-sm bg-red-50/30">
            <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Suspensas
            </div>
            <div className="text-2xl font-bold text-red-700">{metrics.suspended_tenants}</div>
          </div>
        </div>

        {/* Lista de Tenants */}
        <div className="bg-white border border-slate-200 rounded-admin shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-sm font-bold text-slate-800">Lojas Cadastradas no SaaS</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-white text-slate-400 border-b border-slate-100 text-[10px] uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Loja</th>
                  <th className="py-3 px-4 w-32">Status</th>
                  <th className="py-3 px-4 w-32">Plano</th>
                  <th className="py-3 px-4 w-40">Métricas</th>
                  <th className="py-3 px-4 w-32">Data Cadastro</th>
                  <th className="py-3 px-4 w-40 text-right">Ações Master</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.map(tenant => (
                  <tr key={tenant.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{tenant.name}</div>
                      <div className="text-[10px] text-slate-400">/{tenant.slug}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        tenant.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                        tenant.status === 'trial' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {tenant.plan}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                        <span title="Usuários"><Users className="w-3 h-3 inline" /> {tenant._count.users}</span>
                        <span title="Produtos">🍔 {tenant._count.products}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {tenant.status === 'suspended' ? (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: tenant.id, status: 'active' })}
                            className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Reativar Loja"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: tenant.id, status: 'suspended' })}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Suspender Loja"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (window.confirm(`Você entrará no painel da loja "${tenant.name}" como o dono.\nSuas ações refletirão na conta deles.\nContinuar?`)) {
                              impersonateMutation.mutate(tenant.id)
                            }
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-navy/10 hover:bg-navy/20 text-navy rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
                          title="Acessar painel como esta loja"
                        >
                          Entrar <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
