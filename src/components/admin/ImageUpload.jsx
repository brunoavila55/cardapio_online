import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { apiUpload } from '../../lib/api'

// Helper function to resize and crop image to exactly 800x600 pixels (4:3 ratio) via HTML5 Canvas
const resizeAndCropImage = (file, targetWidth = 800, targetHeight = 600) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = targetHeight
        const ctx = canvas.getContext('2d')

        // Calculate aspect ratio and positioning to crop the image nicely (cover style)
        const imgRatio = img.width / img.height
        const targetRatio = targetWidth / targetHeight
        let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height

        if (imgRatio > targetRatio) {
          // Image is wider than 4:3
          sWidth = img.height * targetRatio
          sx = (img.width - sWidth) / 2
        } else {
          // Image is taller than 4:3
          sHeight = img.width / targetRatio
          sy = (img.height - sHeight) / 2
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              resolve(resizedFile)
            } else {
              reject(new Error('Falha ao processar imagem.'))
            }
          },
          'image/jpeg',
          0.85 // High quality JPEG compression
        )
      }
      img.onerror = () => reject(new Error('Erro ao ler a imagem.'))
    }
    reader.onerror = () => reject(new Error('Erro ao carregar o arquivo.'))
  })
}

export function ImageUpload({ value, onChange, disabled = false }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor, envie um arquivo de imagem válido (PNG, JPG, WEBP).')
      }

      // Validate file size (max 500KB)
      if (file.size > 500 * 1024) {
        throw new Error('A imagem deve ter no máximo 500KB.')
      }

      // Automatically resize and crop image to exactly 800x600 pixels (4:3 ratio) for layout consistency
      const processedFile = await resizeAndCropImage(file, 800, 600)

      // Upload file to Node backend
      const data = await apiUpload(processedFile)

      onChange(data.publicUrl)
    } catch (err) {
      console.error('Erro de upload:', err)
      setError(err.message || 'Erro ao enviar a imagem. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }, [onChange])

  const removeImage = (e) => {
    e.stopPropagation()
    onChange('')
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
    disabled: disabled || uploading
  })

  return (
    <div className="w-full">
      {value ? (
        /* Image Thumbnail Preview */
        <div className="relative group aspect-video md:aspect-[4/3] max-h-48 border border-slate-200 rounded-admin overflow-hidden bg-slate-50">
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={removeImage}
              disabled={disabled || uploading}
              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors focus:outline-none"
              title="Excluir imagem"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Dropzone area */
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-admin p-6 text-center cursor-pointer transition-colors focus:outline-none select-none
            ${isDragActive ? 'border-navy bg-navy-light/10' : 'border-slate-300 hover:border-navy bg-slate-50'}
            ${disabled || uploading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center">
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 text-navy animate-spin mb-2" />
                <p className="text-sm font-medium text-slate-700">Enviando imagem...</p>
                <p className="text-xs text-slate-500 mt-1">Isso pode levar alguns segundos</p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-slate-400 mb-2 group-hover:text-navy" />
                <p className="text-sm font-medium text-slate-700">
                  {isDragActive ? 'Solte a imagem aqui' : 'Arraste uma imagem ou clique para selecionar'}
                </p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG ou WEBP até 500KB</p>
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-600 text-xs mt-2 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

export default ImageUpload
