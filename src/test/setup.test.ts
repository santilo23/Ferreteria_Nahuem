import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { Button } from '@/presentation/components/ui/button'
import { cn } from '@/presentation/lib/utils'

describe('Base Architecture Setup Test', () => {
  it('should resolve path aliases and execute utility functions correctly', () => {
    const result = cn('font-bold', true && 'text-blue-500', false && 'hidden')
    expect(result).toBe('font-bold text-blue-500')
  })

  it('should render React components with Testing Library and check DOM', () => {
    render(React.createElement(Button, null, 'Click me'))
    const buttonElement = screen.getByRole('button', { name: /click me/i })
    expect(buttonElement).toBeInTheDocument()
  })
})
