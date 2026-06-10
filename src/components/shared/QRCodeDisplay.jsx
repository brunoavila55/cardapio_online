import React, { useState, useEffect } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Download, Smartphone, Printer, Award, Loader2 } from 'lucide-react'

export function QRCodeDisplay() {
  const menuUrl = window.location.origin
  const hotelName = import.meta.env.VITE_HOTEL_NAME || 'Nome do Estabelecimento'
  
  const [activeTab, setActiveTab] = useState('qr') // 'qr' | 'acrylic' | 'wall'
  const [isGenerating, setIsGenerating] = useState(null)
  const [isGeneratingPreviews, setIsGeneratingPreviews] = useState(true)
  const [previews, setPreviews] = useState({ qr: '', acrylic: '', wall: '' })

  // Helper to draw gold diamond divider on Canvas
  const drawDiamondDivider = (ctx, x, y, width) => {
    ctx.strokeStyle = '#C9A84C'
    ctx.lineWidth = 2
    
    // Left Horizontal Line
    ctx.beginPath()
    ctx.moveTo(x - width / 2, y)
    ctx.lineTo(x - 18, y)
    ctx.stroke()
    
    // Right Horizontal Line
    ctx.beginPath()
    ctx.moveTo(x + 18, y)
    ctx.lineTo(x + width / 2, y)
    ctx.stroke()
    
    // Center Gold Diamond
    ctx.fillStyle = '#C9A84C'
    ctx.beginPath()
    ctx.moveTo(x, y - 8)   // Top
    ctx.lineTo(x + 8, y)   // Right
    ctx.lineTo(x, y + 8)   // Bottom
    ctx.lineTo(x - 8, y)   // Left
    ctx.closePath()
    ctx.fill()
  }

  // Heavy-duty offscreen Canvas rendering function (supports huge crisp print-ready fonts)
  const generatePosterDataUrl = async (type) => {
    const width = type === 'acrylic' ? 800 : (type === 'wall' ? 1200 : 512)
    const height = type === 'acrylic' ? 1200 : (type === 'wall' ? 1600 : 512)
    
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    
    if (type === 'qr') {
      const qrCanvas = document.getElementById('hidden-qr-canvas')
      if (qrCanvas) {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(qrCanvas, 32, 32, width - 64, height - 64)
      } else {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
      }
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob ? URL.createObjectURL(blob) : '')
        }, 'image/png')
      })
    }
    
    // 1. Draw Background
    ctx.fillStyle = '#141D55' // Deep navy blue
    ctx.fillRect(0, 0, width, height)
    
    // 2. Draw Borders
    ctx.strokeStyle = '#C9A84C' // Gold color
    ctx.lineWidth = type === 'acrylic' ? 4 : 6
    ctx.strokeRect(20, 20, width - 40, height - 40)
    
    ctx.strokeStyle = 'rgba(245, 243, 238, 0.15)' // Semi-transparent Ivory line
    ctx.lineWidth = 1.5
    ctx.strokeRect(28, 28, width - 56, height - 56)
    
    // Corner ornaments for wall plaque
    if (type === 'wall') {
      ctx.fillStyle = '#C9A84C'
      const size = 50
      const borderOffset = 20
      const borderThickness = 6
      // Top Left
      ctx.fillRect(borderOffset, borderOffset, size, borderThickness)
      ctx.fillRect(borderOffset, borderOffset, borderThickness, size)
      // Top Right
      ctx.fillRect(width - borderOffset - size, borderOffset, size, borderThickness)
      ctx.fillRect(width - borderOffset - borderThickness, borderOffset, borderThickness, size)
      // Bottom Left
      ctx.fillRect(borderOffset, height - borderOffset - borderThickness, size, borderThickness)
      ctx.fillRect(borderOffset, height - borderOffset - size, borderThickness, size)
      // Bottom Right
      ctx.fillRect(width - borderOffset - size, height - borderOffset - borderThickness, size, borderThickness)
      ctx.fillRect(width - borderOffset - borderThickness, height - borderOffset - size, borderThickness, size)
    }
    
    // 3. Load and Draw Logo
    const logoImg = new Image()
    logoImg.src = '/logo.svg'
    
    await new Promise((resolve) => {
      logoImg.onload = resolve
      logoImg.onerror = resolve
    })
    
    const logoSize = type === 'acrylic' ? 180 : 250
    const logoX = (width - logoSize) / 2
    const logoY = type === 'acrylic' ? 70 : 100
    
    if (logoImg.complete && logoImg.naturalWidth > 0) {
      ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)
    } else {
      ctx.fillStyle = '#C9A84C'
      ctx.font = `italic bold ${type === 'acrylic' ? '36px' : '48px'} Georgia, serif`
      ctx.textAlign = 'center'
      ctx.fillText(hotelName, width / 2, logoY + 80)
    }
    
    // 4. Draw Titles & Text (SUPER LARGE & LEGIBLE FONT SIZES)
    ctx.fillStyle = '#F5F3EE' // Ivory text
    ctx.textAlign = 'center'
    
    if (type === 'acrylic') {
      // ACRYLIC poster text (Mesa)
      ctx.font = 'italic 28px Georgia, serif'
      ctx.fillStyle = '#C9A84C' // Gold subtitle
      ctx.fillText(import.meta.env.VITE_RESTAURANT_NAME || 'Restaurante Principal', width / 2, 280)
      
      ctx.font = 'bold 46px "Inter", "Arial", sans-serif'
      ctx.fillStyle = '#F5F3EE' // Ivory
      ctx.fillText('CARDÁPIO DIGITAL', width / 2, 340)
      
      // Draw gold diamond divider
      drawDiamondDivider(ctx, width / 2, 380, 200)
      
      // Instruction text
      ctx.font = 'bold 22px "Inter", "Arial", sans-serif'
      ctx.fillStyle = '#C9A84C'
      ctx.fillText('APONTE A CÂMERA DO CELULAR', width / 2, 440)
      
      ctx.font = 'italic 20px Georgia, serif'
      ctx.fillStyle = '#F5F3EE'
      ctx.fillText('para escanear o QR Code abaixo', width / 2, 475)
    } else {
      // WALL PLAQUE text (Parede)
      ctx.font = 'italic 34px Georgia, serif'
      ctx.fillStyle = '#F5F3EE'
      ctx.fillText('Seja Bem-vindo ao', width / 2, 380)
      
      ctx.font = 'bold 64px Georgia, serif'
      ctx.fillStyle = '#C9A84C' // Large Gold Hotel Name
      ctx.fillText(hotelName.toUpperCase(), width / 2, 460)
      
      ctx.font = 'italic 38px Georgia, serif'
      ctx.fillStyle = '#F5F3EE'
      ctx.fillText(import.meta.env.VITE_RESTAURANT_NAME || 'Restaurante Principal', width / 2, 520)
      
      // Draw gold diamond divider
      drawDiamondDivider(ctx, width / 2, 570, 300)
      
      // Instruction text
      ctx.font = 'bold 30px "Inter", sans-serif'
      ctx.fillStyle = '#C9A84C'
      ctx.fillText('ESCANEIE O QR CODE ABAIXO', width / 2, 640)
      
      ctx.font = '24px "Inter", sans-serif'
      ctx.fillStyle = '#F5F3EE'
      ctx.fillText('Para visualizar o nosso cardápio digital completo', width / 2, 685)
    }
    
    // 5. Draw QR Code
    const qrCanvas = document.getElementById('hidden-qr-canvas')
    if (qrCanvas) {
      const qrSize = type === 'acrylic' ? 340 : 480
      const qrX = (width - qrSize) / 2
      const qrY = type === 'acrylic' ? 540 : 770
      
      // Draw white background card for QR Code
      ctx.fillStyle = '#FFFFFF'
      const padding = type === 'acrylic' ? 30 : 40
      ctx.fillRect(qrX - padding, qrY - padding, qrSize + padding * 2, qrSize + padding * 2)
      
      // Draw fine gold line around white card
      ctx.strokeStyle = '#C9A84C'
      ctx.lineWidth = 3
      ctx.strokeRect(qrX - padding, qrY - padding, qrSize + padding * 2, qrSize + padding * 2)
      
      // Draw QR Code onto canvas
      ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize)
    }
    
    // 6. Draw Footer Callout
    ctx.fillStyle = '#C9A84C'
    ctx.font = 'bold 16px "Inter", sans-serif'
    ctx.letterSpacing = '3px'
    ctx.fillText('ACESSO RÁPIDO • SEM APLICATIVOS', width / 2, type === 'acrylic' ? 1040 : 1420)
    
    ctx.fillStyle = 'rgba(245, 243, 238, 0.4)'
    ctx.font = '14px "Inter", sans-serif'
    ctx.fillText(menuUrl.toUpperCase(), width / 2, type === 'acrylic' ? 1080 : 1465)
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob ? URL.createObjectURL(blob) : '')
      }, 'image/png')
    })
  }

  // Pre-generate previews on mount or URL changes
  const generateAllPreviews = async () => {
    setIsGeneratingPreviews(true)
    await new Promise((resolve) => setTimeout(resolve, 300)) // Wait for hidden QR canvas to mount
    try {
      const qrUrl = await generatePosterDataUrl('qr')
      const acrylicUrl = await generatePosterDataUrl('acrylic')
      const wallUrl = await generatePosterDataUrl('wall')
      
      setPreviews({
        qr: qrUrl,
        acrylic: acrylicUrl,
        wall: wallUrl
      })
    } catch (err) {
      console.error('Erro ao gerar previews das artes:', err)
    } finally {
      setIsGeneratingPreviews(false)
    }
  }

  useEffect(() => {
    generateAllPreviews()
  }, [])

  // Trigger download from pre-generated previews (100% synchronous to prevent browser security blocks)
  const downloadAsset = (type) => {
    const dataUrl = previews[type]
    if (!dataUrl) {
      alert('A arte ainda está sendo gerada. Por favor, aguarde um segundo e tente novamente.')
      return
    }
    
    setIsGenerating(type)
    try {
      const link = document.createElement('a')
      link.href = dataUrl
      
      let filename = `qrcode-${hotelName.toLowerCase().replace(/\s+/g, '-')}.png`
      if (type === 'acrylic') {
        filename = `arte-mesa-acrilico-${hotelName.toLowerCase().replace(/\s+/g, '-')}.png`
      } else if (type === 'wall') {
        filename = `arte-placa-parede-${hotelName.toLowerCase().replace(/\s+/g, '-')}.png`
      }
      
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      alert('Erro ao baixar arquivo: ' + err.message)
    } finally {
      // Small timeout only to reset loader, does not affect the synchronous download event
      setTimeout(() => setIsGenerating(null), 300)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-stretch w-full mx-auto">
      
      {/* Hidden QR Code Canvas used for rendering source */}
      <div style={{ display: 'none' }}>
        <QRCodeCanvas
          id="hidden-qr-canvas"
          value={menuUrl}
          size={1024}
          bgColor="#FFFFFF"
          fgColor="#141D55"
          level="H"
        />
      </div>

      {/* LEFT COLUMN: Premium Preview Window (Constrained to 340px for PC sidebar optimization) */}
      <div className="w-full lg:w-[340px] flex flex-col justify-center items-center p-6 bg-navy-dark border border-gold shadow-md text-center flex-shrink-0 relative overflow-hidden">
        {/* Decorative corner frames on visualizer panel */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-gold/40" />
        <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-gold/40" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-gold/40" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-gold/40" />

        <span className="text-[9px] text-gold uppercase tracking-widest font-bold mb-4 block">
          Visualizador de Impressão (Live Preview)
        </span>

        {isGeneratingPreviews ? (
          <div className="w-[240px] h-[340px] bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Gerando mockups...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[380px] w-full">
            {activeTab === 'qr' && previews.qr && (
              <div className="bg-white p-6 border-2 border-gold shadow-2xl w-[220px] h-[220px] flex items-center justify-center">
                <img 
                  src={previews.qr} 
                  alt="QR Code Preview" 
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            
            {activeTab === 'acrylic' && previews.acrylic && (
              <div 
                className="relative bg-navy-dark border-4 border-gold shadow-2xl overflow-hidden"
                style={{ width: '240px', height: '360px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
              >
                <img 
                  src={previews.acrylic} 
                  alt="Acrylic Display Stand Preview" 
                  className="w-full h-full object-cover"
                />
                {/* Visualizer Acrylic Base Mockup */}
                <div className="absolute bottom-0 left-0 right-0 h-2.5 bg-gold-light/20 backdrop-blur-sm border-t border-gold/40" />
              </div>
            )}

            {activeTab === 'wall' && previews.wall && (
              <div 
                className="relative bg-navy-dark border-4 border-gold shadow-2xl overflow-hidden"
                style={{ width: '270px', height: '360px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
              >
                <img 
                  src={previews.wall} 
                  alt="Wall Plaque Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="mt-4 px-2 w-full">
              <span className="text-[10px] text-slate-300 tracking-wider block">
                {activeTab === 'qr' && 'Imagem PNG de 1024x1024px com alta nitidez.'}
                {activeTab === 'acrylic' && 'Arte diagramada vertical de 10x15cm (800x1200px) para acrílicos.'}
                {activeTab === 'wall' && 'Placa nobre decorativa de recepção (1200x1600px) para parede.'}
              </span>
              <span className="block text-[10px] font-mono text-gold-light mt-1 select-all break-all opacity-85">
                {menuUrl}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Interactive Control & Selection Suite (PC Optimized Stacked Cards) */}
      <div className="flex-grow flex flex-col justify-start gap-4">
        
        {/* CARD 1: Pure QR Code Option */}
        <div 
          onClick={() => setActiveTab('qr')}
          className={`cursor-pointer bg-white border rounded-admin p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between shadow-sm transition-all hover:shadow-md gap-4 ${
            activeTab === 'qr' ? 'border-navy ring-1 ring-navy' : 'border-slate-200'
          }`}
        >
          <div className="flex items-start gap-4 flex-grow">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
              activeTab === 'qr' ? 'bg-navy text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Apenas o QR Code (PNG)</h4>
              <p className="text-xs text-slate-500 leading-relaxed mt-0.5 max-w-xl">
                Download do arquivo de imagem puro do QR Code em altíssima resolução (1024px).
              </p>
            </div>
          </div>
          <div className="w-full md:w-[200px] flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation()
                downloadAsset('qr')
              }}
              disabled={isGenerating !== null || isGeneratingPreviews}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold uppercase tracking-wider transition-colors rounded ${
                activeTab === 'qr' 
                  ? 'bg-navy hover:bg-navy-mid text-white shadow-sm' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {isGenerating === 'qr' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {activeTab === 'qr' ? 'Baixar PNG Pura' : 'Visualizar Arte'}
            </button>
          </div>
        </div>

        {/* CARD 2: Acrylic Table Stand Option */}
        <div 
          onClick={() => setActiveTab('acrylic')}
          className={`cursor-pointer bg-white border rounded-admin p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between shadow-sm transition-all hover:shadow-md gap-4 ${
            activeTab === 'acrylic' ? 'border-navy ring-1 ring-navy' : 'border-slate-200'
          }`}
        >
          <div className="flex items-start gap-4 flex-grow">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
              activeTab === 'acrylic' ? 'bg-navy text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Suporte de Acrílico de Mesa (10x15cm)</h4>
              <p className="text-xs text-slate-500 leading-relaxed mt-0.5 max-w-xl">
                Arte no tamanho 10x15cm, perfeita para suportes acrílicos de mesas e balcões.
              </p>
            </div>
          </div>
          <div className="w-full md:w-[200px] flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation()
                downloadAsset('acrylic')
              }}
              disabled={isGenerating !== null || isGeneratingPreviews}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold uppercase tracking-wider transition-colors rounded ${
                activeTab === 'acrylic' 
                  ? 'bg-navy hover:bg-navy-mid text-white shadow-sm' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {isGenerating === 'acrylic' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {activeTab === 'acrylic' ? 'Baixar Arte' : 'Visualizar Arte'}
            </button>
          </div>
        </div>

        {/* CARD 3: Wall Plaque Option */}
        <div 
          onClick={() => setActiveTab('wall')}
          className={`cursor-pointer bg-white border rounded-admin p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between shadow-sm transition-all hover:shadow-md gap-4 ${
            activeTab === 'wall' ? 'border-navy ring-1 ring-navy' : 'border-slate-200'
          }`}
        >
          <div className="flex items-start gap-4 flex-grow">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
              activeTab === 'wall' ? 'bg-navy text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Placa Decorativa de Parede</h4>
              <p className="text-xs text-slate-500 leading-relaxed mt-0.5 max-w-xl">
                Arte diagramada em formato A4 ou A3, ideal para enquadrar e fixar na recepção ou nas paredes.
              </p>
            </div>
          </div>
          <div className="w-full md:w-[200px] flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation()
                downloadAsset('wall')
              }}
              disabled={isGenerating !== null || isGeneratingPreviews}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold uppercase tracking-wider transition-colors rounded ${
                activeTab === 'wall' 
                  ? 'bg-navy hover:bg-navy-mid text-white shadow-sm' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {isGenerating === 'wall' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {activeTab === 'wall' ? 'Baixar Placa' : 'Visualizar Arte'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default QRCodeDisplay
