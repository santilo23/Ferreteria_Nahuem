import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CatalogView } from './catalog-view'
import { Product } from '@/core/domain/entities'

describe('CatalogView Component', () => {
  const mockProducts: Product[] = [
    new Product({
      id: 'p1',
      name: 'Tornillo 2 pulgadas',
      description: 'Caja x 100',
      price: 1500,
      cost: 800,
      stock: 20,
      barcode: '7791234567890',
    }),
    new Product({
      id: 'p2',
      name: 'Clavo de acero 1 pulgada',
      price: 800,
      cost: 400,
      stock: 3, // Bajo stock
      barcode: '7799876543210',
    }),
    new Product({
      id: 'p3',
      name: 'Lija al agua 120',
      price: 250,
      cost: 100,
      stock: 0, // Sin stock
    }),
  ]

  const mockCreateProduct = vi.fn()
  const mockRefresh = vi.fn()

  it('should render catalog table with all products and their stock badges', () => {
    render(
      <CatalogView
        products={mockProducts}
        onCreateProduct={mockCreateProduct}
        onRefresh={mockRefresh}
      />
    )

    expect(screen.getByText('Tornillo 2 pulgadas')).toBeInTheDocument()
    expect(screen.getByText('Clavo de acero 1 pulgada')).toBeInTheDocument()
    expect(screen.getByText('Lija al agua 120')).toBeInTheDocument()

    // Badges
    expect(screen.getByText('20 unid.')).toBeInTheDocument()
    expect(screen.getByText('3 unid. (Bajo)')).toBeInTheDocument()
    expect(screen.getByText('0 unid. (Agotado)')).toBeInTheDocument()
  })

  it('should filter products when searching in the omnibox', () => {
    render(
      <CatalogView
        products={mockProducts}
        onCreateProduct={mockCreateProduct}
        onRefresh={mockRefresh}
      />
    )

    const searchInput = screen.getByPlaceholderText(/buscar por nombre, código de barras/i)
    fireEvent.change(searchInput, { target: { value: 'Tornillo' } })

    expect(screen.getByText('Tornillo 2 pulgadas')).toBeInTheDocument()
    expect(screen.queryByText('Clavo de acero 1 pulgada')).not.toBeInTheDocument()
    expect(screen.queryByText('Lija al agua 120')).not.toBeInTheDocument()
  })

  it('should filter products by "Bajo Stock"', () => {
    render(
      <CatalogView
        products={mockProducts}
        onCreateProduct={mockCreateProduct}
        onRefresh={mockRefresh}
      />
    )

    const lowStockBtn = screen.getByRole('button', { name: /bajo stock/i })
    fireEvent.click(lowStockBtn)

    expect(screen.getByText('Clavo de acero 1 pulgada')).toBeInTheDocument()
    expect(screen.queryByText('Tornillo 2 pulgadas')).not.toBeInTheDocument()
    expect(screen.queryByText('Lija al agua 120')).not.toBeInTheDocument()
  })

  it('should filter products by "Sin Stock"', () => {
    render(
      <CatalogView
        products={mockProducts}
        onCreateProduct={mockCreateProduct}
        onRefresh={mockRefresh}
      />
    )

    const outOfStockBtn = screen.getByRole('button', { name: /sin stock/i })
    fireEvent.click(outOfStockBtn)

    expect(screen.getByText('Lija al agua 120')).toBeInTheDocument()
    expect(screen.queryByText('Tornillo 2 pulgadas')).not.toBeInTheDocument()
    expect(screen.queryByText('Clavo de acero 1 pulgada')).not.toBeInTheDocument()
  })
})
