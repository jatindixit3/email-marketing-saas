// Optimistic UI Helper Utilities

/**
 * Generates a temporary optimistic ID for new items
 * Useful when creating items before server response
 */
export function generateOptimisticId(): string {
  return `optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Check if an ID is optimistic (not yet persisted to server)
 */
export function isOptimisticId(id: string | number): boolean {
  return typeof id === 'string' && id.startsWith('optimistic-')
}

/**
 * Replace optimistic ID with real ID from server
 */
export function replaceOptimisticId<T extends { id: string | number }>(
  items: T[],
  optimisticId: string,
  realId: string | number
): T[] {
  return items.map((item) => (item.id === optimisticId ? { ...item, id: realId } : item))
}

/**
 * Optimistic update wrapper for common patterns
 */
export class OptimisticUpdater<T> {
  constructor(
    private data: T,
    private setPending: (pending: boolean) => void
  ) {}

  /**
   * Execute an optimistic update with automatic rollback
   */
  async update(optimisticValue: T, asyncAction: () => Promise<T>): Promise<T> {
    const previousValue = this.data
    this.setPending(true)

    try {
      // Apply optimistic update
      this.data = optimisticValue

      // Execute async action
      const result = await asyncAction()

      // Update with real value
      this.data = result
      this.setPending(false)

      return result
    } catch (error) {
      // Rollback on error
      this.data = previousValue
      this.setPending(false)
      throw error
    }
  }
}

/**
 * Optimistic list operations
 */
export const optimisticList = {
  /**
   * Add item to list optimistically
   */
  add: <T extends { id: string | number }>(items: T[], newItem: T): T[] => {
    return [...items, newItem]
  },

  /**
   * Remove item from list optimistically
   */
  remove: <T extends { id: string | number }>(items: T[], id: string | number): T[] => {
    return items.filter((item) => item.id !== id)
  },

  /**
   * Update item in list optimistically
   */
  update: <T extends { id: string | number }>(
    items: T[],
    id: string | number,
    updates: Partial<T>
  ): T[] => {
    return items.map((item) => (item.id === id ? { ...item, ...updates } : item))
  },

  /**
   * Bulk remove items optimistically
   */
  removeMany: <T extends { id: string | number }>(items: T[], ids: (string | number)[]): T[] => {
    return items.filter((item) => !ids.includes(item.id))
  },

  /**
   * Bulk update items optimistically
   */
  updateMany: <T extends { id: string | number }>(
    items: T[],
    ids: (string | number)[],
    updates: Partial<T>
  ): T[] => {
    return items.map((item) => (ids.includes(item.id) ? { ...item, ...updates } : item))
  },

  /**
   * Move item to different position optimistically
   */
  reorder: <T>(items: T[], fromIndex: number, toIndex: number): T[] => {
    const result = [...items]
    const [removed] = result.splice(fromIndex, 1)
    result.splice(toIndex, 0, removed)
    return result
  },
}

/**
 * Debounce optimistic updates to prevent excessive re-renders
 */
export function debounceOptimistic<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

/**
 * Optimistic state manager with undo/redo support
 */
export class OptimisticStateManager<T> {
  private history: T[] = []
  private currentIndex = -1
  private maxHistorySize = 50

  constructor(initialState: T) {
    this.history.push(initialState)
    this.currentIndex = 0
  }

  /**
   * Get current state
   */
  get current(): T {
    return this.history[this.currentIndex]
  }

  /**
   * Push new state
   */
  push(state: T): void {
    // Remove any states after current index (for redo)
    this.history = this.history.slice(0, this.currentIndex + 1)

    // Add new state
    this.history.push(state)
    this.currentIndex++

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift()
      this.currentIndex--
    }
  }

  /**
   * Undo to previous state
   */
  undo(): T | null {
    if (this.currentIndex > 0) {
      this.currentIndex--
      return this.current
    }
    return null
  }

  /**
   * Redo to next state
   */
  redo(): T | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++
      return this.current
    }
    return null
  }

  /**
   * Check if can undo
   */
  canUndo(): boolean {
    return this.currentIndex > 0
  }

  /**
   * Check if can redo
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history = [this.current]
    this.currentIndex = 0
  }
}

/**
 * Merge server data with optimistic updates
 * Keeps optimistic items that haven't been synced yet
 */
export function mergeOptimisticData<T extends { id: string | number }>(
  serverData: T[],
  optimisticData: T[]
): T[] {
  const serverIds = new Set(serverData.map((item) => item.id))

  // Keep optimistic items that aren't in server data yet
  const optimisticOnly = optimisticData.filter(
    (item) => isOptimisticId(item.id) || !serverIds.has(item.id)
  )

  // Combine server data with optimistic-only items
  return [...serverData, ...optimisticOnly]
}
