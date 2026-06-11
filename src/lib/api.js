import { getTenantSlug, isRootDomain } from './tenant'

const API_BASE_URL = 'http://localhost:3000/api'

export const apiFetch = async (endpoint, options = {}) => {
  let token = localStorage.getItem('token')
  const slug = getTenantSlug()

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(slug ? { 'X-Tenant-Slug': slug } : {}),
    ...options.headers
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include'
  })

  // Lógica de Refresh Token (se 401 e não for rota de auth)
  if (response.status === 401 && !endpoint.startsWith('/auth/')) {
    try {
      // Tenta renovar o token
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include'
      })

      if (refreshRes.ok) {
        const { token: newToken } = await refreshRes.json()
        localStorage.setItem('token', newToken)
        
        // Tenta a requisição original novamente
        const newHeaders = {
          ...headers,
          'Authorization': `Bearer ${newToken}`
        }
        
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers: newHeaders,
          credentials: 'include'
        })
      } else {
        // Se falhar o refresh, desloga
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    } catch (err) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
  }

  // Se não for sucesso e tiver corpo JSON, tenta extrair o erro
  if (!response.ok) {
    let errorMsg = 'Erro na requisição'
    try {
      const errorData = await response.json()
      errorMsg = errorData.error || errorMsg
    } catch (e) {
      errorMsg = response.statusText
    }
    throw new Error(errorMsg)
  }

  return response.json()
}

export const apiUpload = async (file) => {
  const token = localStorage.getItem('token')
  const slug = getTenantSlug()
  const formData = new FormData()
  formData.append('file', file)

  const headers = {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(slug ? { 'X-Tenant-Slug': slug } : {})
  }

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers,
    body: formData
  })

  if (!response.ok) {
    let errorMsg = 'Erro no upload'
    try {
      const errorData = await response.json()
      errorMsg = errorData.error || errorMsg
    } catch (e) {
      errorMsg = response.statusText
    }
    throw new Error(errorMsg)
  }

  return response.json()
}

export const apiDeleteUpload = async (fileUrl) => {
  // Extrai apenas o nome do arquivo da URL (ex: http://localhost:3000/uploads/arquivo.jpg -> arquivo.jpg)
  const parts = fileUrl.split('/uploads/')
  if (parts.length > 1) {
    const filename = parts[1]
    return apiFetch(`/upload/${filename}`, { method: 'DELETE' })
  }
}
