import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'
import { getTenantSlug } from '../lib/tenant'

const fetchTenantBySlug = async (slug) => {
  if (!slug) return null
  return apiFetch(`/tenants/by-slug/${slug}`)
}

export function useCurrentTenant() {
  const slug = getTenantSlug()

  const { data: tenant, isLoading, error } = useQuery({
    queryKey: ['tenant', slug],
    queryFn: () => fetchTenantBySlug(slug),
    enabled: !!slug, // Só executa a query se houver um slug
  })

  return {
    slug,
    tenant,
    isLoading,
    error,
  }
}
