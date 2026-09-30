import { useEffect } from 'react'

export interface UseGlobalShortcutsOptions {
  onNavigateDashboard?: () => void
  onNavigatePos?: () => void
  onNavigateEntries?: () => void
  onNavigateStock?: () => void
  onNavigateSales?: () => void
  onNavigateSuppliers?: () => void
  onEscape?: () => void
  enabled?: boolean
}

export function useGlobalShortcuts({
  onNavigateDashboard,
  onNavigatePos,
  onNavigateEntries,
  onNavigateStock,
  onNavigateSales,
  onNavigateSuppliers,
  onEscape,
  enabled = true,
}: UseGlobalShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'F1':
          e.preventDefault()
          onNavigateDashboard?.()
          break
        case 'F2':
          e.preventDefault()
          onNavigatePos?.()
          break
        case 'F3':
          e.preventDefault()
          onNavigateEntries?.()
          break
        case 'F4':
          e.preventDefault()
          onNavigateStock?.()
          break
        case 'F5':
          // Prevent browser refresh so desktop app remains in state
          e.preventDefault()
          if (onNavigateSales) {
            onNavigateSales()
          } else {
            onNavigateSuppliers?.()
          }
          break
        case 'F6':
          e.preventDefault()
          onNavigateSuppliers?.()
          break
        case 'Escape':
          onEscape?.()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    enabled,
    onNavigateDashboard,
    onNavigatePos,
    onNavigateEntries,
    onNavigateStock,
    onNavigateSuppliers,
    onEscape,
  ])
}
