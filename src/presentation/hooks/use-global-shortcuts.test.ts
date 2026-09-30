import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useGlobalShortcuts } from './use-global-shortcuts'

describe('useGlobalShortcuts Hook', () => {
  it('should trigger navigation callbacks when F1-F5 keys are pressed and prevent default', () => {
    const onNavigateDashboard = vi.fn()
    const onNavigatePos = vi.fn()
    const onNavigateEntries = vi.fn()
    const onNavigateStock = vi.fn()
    const onNavigateSuppliers = vi.fn()
    const onEscape = vi.fn()

    renderHook(() =>
      useGlobalShortcuts({
        onNavigateDashboard,
        onNavigatePos,
        onNavigateEntries,
        onNavigateStock,
        onNavigateSuppliers,
        onEscape,
      })
    )

    // Test F1 -> Dashboard
    const f1Event = new KeyboardEvent('keydown', { key: 'F1', cancelable: true })
    const preventSpyF1 = vi.spyOn(f1Event, 'preventDefault')
    window.dispatchEvent(f1Event)
    expect(preventSpyF1).toHaveBeenCalled()
    expect(onNavigateDashboard).toHaveBeenCalledTimes(1)

    // Test F2 -> POS
    const f2Event = new KeyboardEvent('keydown', { key: 'F2', cancelable: true })
    const preventSpyF2 = vi.spyOn(f2Event, 'preventDefault')
    window.dispatchEvent(f2Event)
    expect(preventSpyF2).toHaveBeenCalled()
    expect(onNavigatePos).toHaveBeenCalledTimes(1)

    // Test F3 -> Entries
    const f3Event = new KeyboardEvent('keydown', { key: 'F3', cancelable: true })
    const preventSpyF3 = vi.spyOn(f3Event, 'preventDefault')
    window.dispatchEvent(f3Event)
    expect(preventSpyF3).toHaveBeenCalled()
    expect(onNavigateEntries).toHaveBeenCalledTimes(1)

    // Test F4 -> Stock Catalog
    const f4Event = new KeyboardEvent('keydown', { key: 'F4', cancelable: true })
    const preventSpyF4 = vi.spyOn(f4Event, 'preventDefault')
    window.dispatchEvent(f4Event)
    expect(preventSpyF4).toHaveBeenCalled()
    expect(onNavigateStock).toHaveBeenCalledTimes(1)

    // Test F5 -> Suppliers (prevents browser reload)
    const f5Event = new KeyboardEvent('keydown', { key: 'F5', cancelable: true })
    const preventSpyF5 = vi.spyOn(f5Event, 'preventDefault')
    window.dispatchEvent(f5Event)
    expect(preventSpyF5).toHaveBeenCalled()
    expect(onNavigateSuppliers).toHaveBeenCalledTimes(1)

    // Test Escape -> Cancel / Close
    const escEvent = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true })
    window.dispatchEvent(escEvent)
    expect(onEscape).toHaveBeenCalledTimes(1)
  })

  it('should not trigger callbacks when enabled is false', () => {
    const onNavigatePos = vi.fn()

    renderHook(() =>
      useGlobalShortcuts({
        onNavigatePos,
        enabled: false,
      })
    )

    const f2Event = new KeyboardEvent('keydown', { key: 'F2', cancelable: true })
    window.dispatchEvent(f2Event)
    expect(onNavigatePos).not.toHaveBeenCalled()
  })
})
