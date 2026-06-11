// Cloudflare Pages Functions - Middleware (_middleware.js)
// Este código ilustra como interceptar requisições no Cloudflare Pages para lidar com o subdomínio

export async function onRequest(context) {
  const { request, next } = context
  const url = new URL(request.url)
  const hostname = url.hostname

  // Identificar slug
  const parts = hostname.split('.')
  let slug = null

  // Se tem 4 partes (tenant.subdominio.com.br) pega o slug
  // Adapte essa lógica com base no domínio que usar em produção
  if (parts.length > 3) {
    slug = parts[0]
  }

  // Interceptar chamadas à API
  if (url.pathname.startsWith('/api/')) {
    // Redirecionar para o backend Node.js remoto (Railway, Render, VPS)
    const backendUrl = new URL(request.url)
    backendUrl.hostname = 'api.meubackend.com.br' // Troque pelo domínio do backend Node
    backendUrl.port = '' // 443 implícito no https
    backendUrl.protocol = 'https:'

    // Construir nova requisição enviando o X-Tenant-Slug
    const apiRequest = new Request(backendUrl, request)
    if (slug) {
      apiRequest.headers.set('X-Tenant-Slug', slug)
    }

    return fetch(apiRequest)
  }

  // Deixar o Cloudflare Pages servir o index.html/assets (SPA Fallback nativo do Pages)
  return next()
}
