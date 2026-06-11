import React, { useState, useEffect } from 'react'
import { apiFetch, apiUpload, apiDeleteUpload } from '../../lib/api'
import { Loader2, Save, Image as ImageIcon } from 'lucide-react'
import imageCompression from 'browser-image-compression'

export function TenantSettings({ tenantId }) {
  const [tenant, setTenant] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form states
  const [name, setName] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#1E2A7A')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)

  useEffect(() => {
    if (!tenantId) return
    const fetchTenant = async () => {
      setIsLoading(true)
      try {
        const data = await apiFetch(`/tenants/${tenantId}`)
      if (data) {
        setTenant(data)
        setName(data.name || '')
        setPrimaryColor(data.primary_color || '#1E2A7A')
        setLogoUrl(data.logo_url || '')
      }
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchTenant()
  }, [tenantId])

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const options = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 400,
        useWebWorker: true,
      }
      const compressedFile = await imageCompression(file, options)
      setLogoFile(compressedFile)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result)
      }
      reader.readAsDataURL(compressedFile)
    } catch (error) {
      alert('Erro ao processar a imagem: ' + error.message)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      let finalLogoUrl = logoUrl

      // Upload new logo if selected
      if (logoFile) {
        // Delete old logo if exists
        if (logoUrl) {
          const parts = logoUrl.split('/product-images/')
          if (parts.length > 1) {
            await apiDeleteUpload(logoUrl)
          }
        }

        const data = await apiUpload(logoFile)
        finalLogoUrl = data.publicUrl
      }

      await apiFetch(`/tenants/${tenantId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: name.trim(),
          primary_color: primaryColor,
          logo_url: finalLogoUrl
        })
      })

      setLogoUrl(finalLogoUrl)
      setLogoFile(null)
      setLogoPreview(null)
      alert('Configurações salvas com sucesso!')
      
    } catch (err) {
      alert('Erro ao salvar configurações: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-navy animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-500">Carregando configurações...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900">Configurações do Restaurante</h2>
        <p className="text-xs text-slate-500">Personalize a identidade visual do seu cardápio público.</p>
      </div>

      <form onSubmit={handleSave} className="max-w-2xl space-y-8">
        
        {/* Logo Section */}
        <div className="bg-white p-6 border border-slate-200 rounded-admin shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Logomarca</h3>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-32 h-32 bg-slate-100 rounded flex items-center justify-center border border-slate-200 overflow-hidden shrink-0">
              {logoPreview || logoUrl ? (
                <img 
                  src={logoPreview || logoUrl} 
                  alt="Logo preview" 
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <ImageIcon className="w-10 h-10 text-slate-300" />
              )}
            </div>
            <div className="flex-grow space-y-3">
              <label className="block text-xs font-semibold text-slate-700">Nova Logomarca</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-xs text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded file:border-0
                  file:text-xs file:font-semibold
                  file:bg-navy file:text-white
                  hover:file:bg-navy-mid cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 mt-1">Recomendado: Imagem quadrada (PNG transparente), máx. 500KB.</p>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-white p-6 border border-slate-200 rounded-admin shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Informações e Cores</h3>
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nome do Restaurante</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-admin text-sm text-slate-800 outline-none focus:bg-white focus:border-navy focus:ring-1 focus:ring-navy transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Cor Principal (Primary Color)</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-12 p-1 bg-white border border-slate-200 rounded cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-32 p-2 bg-slate-50 border border-slate-200 rounded-admin text-sm text-slate-800 outline-none focus:bg-white focus:border-navy transition-all font-mono"
                pattern="^#+([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">Esta cor será aplicada nos botões, cabeçalhos e elementos de destaque do cardápio público.</p>
          </div>
        </div>

        {/* Action */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-navy hover:bg-navy-mid text-white rounded-admin text-xs uppercase tracking-widest font-semibold shadow-md transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Configurações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
