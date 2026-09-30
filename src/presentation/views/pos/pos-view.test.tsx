import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PosView } from './pos-view'
import { Product } from '@/core/domain/entities'

describe('PosView Component (Fuzzy Search & Omnibox)', () => {
  const mockProducts: Product[] = [
    new Product({
      id: 'p-pos-1',
      name: 'Clavos punta París 2 pulgadas',
      price: 2500,
      cost: 1200,
      stock: 30,
      barcode: '7799876543210',
    }),
    new Product({
      id: 'p-pos-2',
      name: 'Tornillo Phillips 1 pulgada',
      price: 1800,
      cost: 900,
      stock: 50,
      barcode: '7791112223334',
    }),
  ]

  const mockProcessSale = vi.fn().mockResolvedValue({
    receipt: {
      id: 'rec-1234',
      totalAmount: 2500,
      customerName: 'Consumidor Final',
      items: [],
      date: new Date(),
      createdAt: new Date(),
    },
    updatedProducts: [],
    change: 0,
    ticketText: 'TICKET DEMO',
  })

  it('should render the giant omnibox and empty cart state', () => {
    render(<PosView products={mockProducts} onProcessSale={mockProcessSale} />)

    expect(screen.getByPlaceholderText(/teclea para buscar producto/i)).toBeInTheDocument()
    expect(screen.getByText(/el carrito de venta está vacío/i)).toBeInTheDocument()
    expect(screen.getAllByText('$0,00').length).toBeGreaterThan(0)
  })

  it('should fuzzy search "clav" and display "Clavos punta París 2 pulgadas"', async () => {
    render(<PosView products={mockProducts} onProcessSale={mockProcessSale} />)

    const omnibox = screen.getByPlaceholderText(/teclea para buscar producto/i)
    fireEvent.change(omnibox, { target: { value: 'clav' } })

    const option = await screen.findByRole('button', { name: /Clavos punta París 2 pulgadas/i })
    expect(option).toBeInTheDocument()
  })

  it('should add fuzzy-matched product to cart and update total', async () => {
    render(<PosView products={mockProducts} onProcessSale={mockProcessSale} />)

    const omnibox = screen.getByPlaceholderText(/teclea para buscar producto/i)
    fireEvent.change(omnibox, { target: { value: 'clav' } })

    const option = await screen.findByRole('button', { name: /Clavos punta París 2 pulgadas/i })
    fireEvent.click(option)

    // Check item is now in cart table
    expect(screen.getByText('Clavos punta París 2 pulgadas')).toBeInTheDocument()
    // Total should be $2.500,00
    expect(screen.getAllByText('$2.500,00').length).toBeGreaterThan(0)
  })

  it('should process checkout when "Cobrar e Imprimir Ticket" is clicked', async () => {
    render(<PosView products={mockProducts} onProcessSale={mockProcessSale} />)

    const omnibox = screen.getByPlaceholderText(/teclea para buscar producto/i)
    fireEvent.change(omnibox, { target: { value: 'clav' } })
    const option = await screen.findByRole('button', { name: /Clavos punta París 2 pulgadas/i })
    fireEvent.click(option)

    const checkoutBtn = screen.getByRole('button', { name: /cobrar e imprimir ticket/i })
    fireEvent.click(checkoutBtn)

    await waitFor(() => {
      expect(mockProcessSale).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: 'Consumidor Final',
          paymentMethod: 'EFECTIVO',
          items: [{ productId: 'p-pos-1', quantity: 1 }],
        })
      )
    })
  })
})
