'use client'

// Optimistic UI Update Hooks

import { useState, useCallback } from 'react'

interface OptimisticState<T> {
  data: T
  isPending: boolean
  error: Error | null
}

interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  rollbackOnError?: boolean
}

/**
 * Hook for optimistic updates with automatic rollback on error
 *
 * @example
 * const { data, isPending, update } = useOptimisticUpdate(contacts, {
 *   onSuccess: (contacts) => console.log('Updated!'),
 *   onError: (error) => toast.error(error.message)
 * })
 *
 * // Add contact optimistically
 * update(
 *   [...contacts, newContact],
 *   () => api.addContact(newContact)
 * )
 */
export function useOptimisticUpdate<T>(
  initialData: T,
  options: OptimisticUpdateOptions<T> = {}
) {
  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    isPending: false,
    error: null,
  })

  const update = useCallback(
    async (optimisticData: T, asyncAction: () => Promise<T>) => {
      const previousData = state.data

      // Apply optimistic update immediately
      setState({
        data: optimisticData,
        isPending: true,
        error: null,
      })

      try {
        // Execute actual async action
        const result = await asyncAction()

        // Update with real data
        setState({
          data: result,
          isPending: false,
          error: null,
        })

        options.onSuccess?.(result)
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Update failed')

        // Rollback to previous data if enabled
        if (options.rollbackOnError !== false) {
          setState({
            data: previousData,
            isPending: false,
            error: err,
          })
        } else {
          setState((prev) => ({
            ...prev,
            isPending: false,
            error: err,
          }))
        }

        options.onError?.(err)
      }
    },
    [state.data, options]
  )

  return {
    ...state,
    update,
  }
}

/**
 * Hook for optimistic list operations (add, remove, update items)
 */
export function useOptimisticList<T extends { id: string | number }>(
  initialItems: T[],
  options: OptimisticUpdateOptions<T[]> = {}
) {
  const { data, isPending, error, update } = useOptimisticUpdate(initialItems, options)

  // Add item optimistically
  const addItem = useCallback(
    async (newItem: T, asyncAction: () => Promise<T>) => {
      return update([...data, newItem], async () => {
        const result = await asyncAction()
        return [...data, result]
      })
    },
    [data, update]
  )

  // Remove item optimistically
  const removeItem = useCallback(
    async (itemId: string | number, asyncAction: () => Promise<void>) => {
      return update(
        data.filter((item) => item.id !== itemId),
        async () => {
          await asyncAction()
          return data.filter((item) => item.id !== itemId)
        }
      )
    },
    [data, update]
  )

  // Update item optimistically
  const updateItem = useCallback(
    async (itemId: string | number, updates: Partial<T>, asyncAction: () => Promise<T>) => {
      return update(
        data.map((item) => (item.id === itemId ? { ...item, ...updates } : item)),
        async () => {
          const result = await asyncAction()
          return data.map((item) => (item.id === itemId ? result : item))
        }
      )
    },
    [data, update]
  )

  // Bulk remove items optimistically
  const removeItems = useCallback(
    async (itemIds: (string | number)[], asyncAction: () => Promise<void>) => {
      return update(
        data.filter((item) => !itemIds.includes(item.id)),
        async () => {
          await asyncAction()
          return data.filter((item) => !itemIds.includes(item.id))
        }
      )
    },
    [data, update]
  )

  return {
    items: data,
    isPending,
    error,
    addItem,
    removeItem,
    updateItem,
    removeItems,
  }
}

/**
 * Hook for optimistic mutations with loading state
 */
export function useOptimisticMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void
    onError?: (error: Error, variables: TVariables) => void
    onMutate?: (variables: TVariables) => void | Promise<void>
  } = {}
) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(
    async (variables: TVariables) => {
      setIsPending(true)
      setError(null)

      try {
        // Call onMutate before mutation
        await options.onMutate?.(variables)

        // Execute mutation
        const data = await mutationFn(variables)

        setIsPending(false)
        options.onSuccess?.(data, variables)

        return data
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Mutation failed')
        setError(error)
        setIsPending(false)
        options.onError?.(error, variables)
        throw error
      }
    },
    [mutationFn, options]
  )

  return {
    mutate,
    isPending,
    error,
  }
}
