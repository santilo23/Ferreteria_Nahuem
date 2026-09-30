import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ShortcutBar } from './shortcut-bar'

describe('ShortcutBar Component', () => {
  it('should render all keyboard shortcut indicators', () => {
    render(<ShortcutBar activeTab="dashboard" onTabChange={vi.fn()} />)

    expect(screen.getByText('F1')).toBeInTheDocument()
    expect(screen.getByText('F2')).toBeInTheDocument()
    expect(screen.getByText('F3')).toBeInTheDocument()
    expect(screen.getByText('F4')).toBeInTheDocument()
    expect(screen.getByText('F5')).toBeInTheDocument()
    expect(screen.getByText(/sqlite local activo/i)).toBeInTheDocument()
  })

  it('should call onTabChange when clicking a shortcut badge', () => {
    const handleTabChange = vi.fn()
    render(<ShortcutBar activeTab="dashboard" onTabChange={handleTabChange} />)

    const posShortcut = screen.getByText('F2').closest('button')
    if (posShortcut) {
      fireEvent.click(posShortcut)
      expect(handleTabChange).toHaveBeenCalledWith('pos')
    }
  })
})
