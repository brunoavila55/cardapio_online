import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'

// Fetch all products
const fetchAllProducts = async (tenantId) => {
  if (!tenantId) return []
  return apiFetch(`/products?tenant_id=${tenantId}`)
}

export function useProducts(tenantId) {
  const queryClient = useQueryClient()

  // Query to get all products
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products', tenantId],
    queryFn: () => fetchAllProducts(tenantId),
    enabled: !!tenantId,
  })

  // Mutation to create a product
  const createMutation = useMutation({
    mutationFn: async (newProduct) => {
      return apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify(newProduct)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] })
    },
  })

  // Mutation to update a product
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      return apiFetch(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] })
    },
  })

  // Mutation to delete a product
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return apiFetch(`/products/${id}`, {
        method: 'DELETE'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] })
    },
  })

  return {
    products,
    isLoading,
    error,
    createProduct: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateProduct: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteProduct: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  }
}
