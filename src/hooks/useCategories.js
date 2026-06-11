import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'

// Fetch all categories
const fetchAllCategories = async (tenantId) => {
  if (!tenantId) return []
  return apiFetch(`/categories?tenant_id=${tenantId}`)
}

export function useCategories(tenantId) {
  const queryClient = useQueryClient()

  // Query to get all categories
  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ['categories', tenantId],
    queryFn: () => fetchAllCategories(tenantId),
    enabled: !!tenantId,
  })

  // Mutation to create a category
  const createMutation = useMutation({
    mutationFn: async (newCategory) => {
      return apiFetch('/categories', {
        method: 'POST',
        body: JSON.stringify(newCategory)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', tenantId] })
    },
  })

  // Mutation to update a category
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      return apiFetch(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] })
    },
  })

  // Mutation to delete a category
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return apiFetch(`/categories/${id}`, {
        method: 'DELETE'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] })
    },
  })

  return {
    categories,
    isLoading,
    error,
    createCategory: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateCategory: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteCategory: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  }
}
