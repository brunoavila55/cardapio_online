export function getTenantSlug() {
  const hostname = window.location.hostname
  // Suporte a localhost para desenvolvimento:
  if (hostname === 'localhost' || hostname === '127.0.0.1') return null
  
  const isLocal = hostname.endsWith('.localhost')
  
  const parts = hostname.split('.')
  
  if (isLocal) {
    // subdominio.localhost → slug
    // localhost → null (já pego no if acima)
    return parts.length > 1 && parts[0] !== 'localhost' ? parts[0] : null
  }

  // Para produção (.com.br)
  // subdominio.com.br = 3 partes → domínio raiz → null
  // saoluiz.subdominio.com.br = 4 partes → slug = parts[0]
  const isRootDomain = parts.length === 3
  return isRootDomain ? null : parts[0]
}

export function isRootDomain() {
  return getTenantSlug() === null
}
