import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'

export function useOnboarding() {
  const queryClient = useQueryClient()

  const { data: onboarding, isLoading } = useQuery({
    queryKey: ['onboarding'],
    queryFn: () => apiFetch('/onboarding')
  })

  const markThemeCustomizedMutation = useMutation({
    mutationFn: () => apiFetch('/onboarding/theme', { method: 'PUT' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] })
    }
  })

  const markCompletedMutation = useMutation({
    mutationFn: () => apiFetch('/onboarding/complete', { method: 'PUT' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] })
    }
  })

  return {
    onboarding,
    isLoading,
    markThemeCustomized: markThemeCustomizedMutation.mutateAsync,
    markCompleted: markCompletedMutation.mutateAsync,
    isMarkingTheme: markThemeCustomizedMutation.isPending
  }
}
