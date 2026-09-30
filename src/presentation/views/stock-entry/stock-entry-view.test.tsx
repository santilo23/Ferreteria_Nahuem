import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StockEntryView } from './stock-entry-view'
import { Product, Supplier, StockMovement } from '@/core/domain/entities'

describe('StockEntryView Component', () => {
  const mockProducts: Product[] = [
    new Product({
      id: 'p-1',
      name: 'Disco de Corte 4.5"',
      price: 1200,
      cost: 600,
      stock: 15,
      barcode: '7791234567890',
    }),
  ]

  const mockSuppliers: Supplier[] = [
    new Supplier({
      id: 's-1',
      name: 'Abrasivos del Centro',
    }),
  ]

  const mockMovements: StockMovement[] = [
    new StockMovement({
      id: 'm-1',
      productId: 'p-1',
      supplierId: 's-1',
      type: 'IN',
      quantity: 50,
      reason: 'Remito 1045',
      date: new Date('2026-10-01T12:00:00Z'),
    }),
  ]

  const mockRegisterEntry = vi.fn().mockResolvedValue(mockProducts[0])
  const mockManualAdjustment = vi.fn().mockResolvedValue(mockProducts[0])

  it('should render the view, movement history and search field', () => {
    render(
      <StockEntryView
        products={mockProducts}
        suppliers={mockSuppliers}
        movements={mockMovements}
        onRegisterEntry={mockRegisterEntry}
        onManualAdjustment={mockManualAdjustment}
      />
    )

    expect(screen.getByText(/Entrada de Mercadería y Ajustes/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/escribe para buscar/i)).toBeInTheDocument()
    expect(screen.getByText(/Remito 1045/i)).toBeInTheDocument()
    expect(screen.getByText('+50')).toBeInTheDocument()
  })

  it('should filter and select a product, displaying current stock and cost', async () => {
    render(
      <StockEntryView
        products={mockProducts}
        suppliers={mockSuppliers}
        movements={mockMovements}
        onRegisterEntry={mockRegisterEntry}
        onManualAdjustment={mockManualAdjustment}
      />
    )

    const searchInput = screen.getByPlaceholderText(/escribe para buscar/i)
    fireEvent.change(searchInput, { target: { value: 'Disco' } })

    // Autocomplete option appears
    const option = await screen.findByRole('button', { name: /Disco de Corte 4.5"/i })
    fireEvent.click(option)

    // Check product banner appears
    expect(screen.getByText('Producto Seleccionado')).toBeInTheDocument()
    expect(screen.getByText('15 unidades')).toBeInTheDocument()
  })

  it('should submit stock entry when valid data is entered', async () => {
    render(
      <StockEntryView
        products={mockProducts}
        suppliers={mockSuppliers}
        movements={mockMovements}
        onRegisterEntry={mockRegisterEntry}
        onManualAdjustment={mockManualAdjustment}
      />
    )

    const searchInput = screen.getByPlaceholderText(/escribe para buscar/i)
    fireEvent.change(searchInput, { target: { value: 'Disco' } })
    const option = await screen.findByRole('button', { name: /Disco de Corte 4.5"/i })
    fireEvent.click(option)

    const qtyInput = screen.getByPlaceholderText('ej. 25')
    fireEvent.change(qtyInput, { target: { value: '20' } })

    const submitBtn = screen.getByRole('button', { name: /registrar ingreso de stock/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockRegisterEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'p-1',
          quantity: 20,
        })
      )
    })
  })
})
