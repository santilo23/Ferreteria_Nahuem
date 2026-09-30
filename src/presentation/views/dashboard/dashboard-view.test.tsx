import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DashboardView } from './dashboard-view'
import { Product, Receipt, ReceiptItem } from '@/core/domain/entities'

describe('DashboardView Component', () => {
  const mockProducts: Product[] = [
    new Product({
      id: 'p-1',
      name: 'Tornillo Autoperforante 1"',
      price: 3200,
      cost: 1600,
      stock: 50,
      barcode: '7791234567890',
    }),
    new Product({
      id: 'p-2',
      name: 'Clavos París 2"',
      price: 2800,
      cost: 1400,
      stock: 3, // Bajo stock (<= 5)
      barcode: '7799876543210',
    }),
    new Product({
      id: 'p-3',
      name: 'Disco de Corte 115mm',
      price: 1100,
      cost: 500,
      stock: 0, // Agotado
      barcode: '7795556667778',
    }),
  ]

  const today = new Date()
  const mockReceipts: Receipt[] = [
    new Receipt({
      id: 'rec-001',
      customerName: 'Juan Pérez',
      items: [
        new ReceiptItem({
          id: 'item-1',
          receiptId: 'rec-001',
          productId: 'p-1',
          quantity: 2,
          unitPrice: 3200,
        }),
      ],
      date: today,
    }),
  ]

  const mockNavigate = vi.fn()
  const mockReponer = vi.fn()

  it('should render key metric cards accurately', () => {
    render(
      <DashboardView
        products={mockProducts}
        receipts={mockReceipts}
        onNavigate={mockNavigate}
        onSelectProductForEntry={mockReponer}
      />
    )

    // Total products
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText(/total productos/i)).toBeInTheDocument()

    // Low stock and out of stock indicators
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/bajo stock/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/agotados/i)).toBeInTheDocument()

    // Sales today ($6.400,00)
    expect(screen.getAllByText(/6\.400,00/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/ventas de hoy/i)).toBeInTheDocument()
  })

  it('should list products requiring immediate restock with alert badges', () => {
    render(
      <DashboardView
        products={mockProducts}
        receipts={mockReceipts}
        onNavigate={mockNavigate}
        onSelectProductForEntry={mockReponer}
      />
    )

    expect(screen.getByText('Disco de Corte 115mm')).toBeInTheDocument()
    expect(screen.getByText('Clavos París 2"')).toBeInTheDocument()
    expect(screen.getByText(/sin stock/i)).toBeInTheDocument()

    // Click Reponer button for product with low stock
    const reponerButtons = screen.getAllByRole('button', { name: /reponer/i })
    expect(reponerButtons.length).toBeGreaterThanOrEqual(1)
    fireEvent.click(reponerButtons[0])

    expect(mockReponer).toHaveBeenCalled()
  })

  it('should render quick action buttons and trigger navigation', () => {
    render(
      <DashboardView
        products={mockProducts}
        receipts={mockReceipts}
        onNavigate={mockNavigate}
      />
    )

    const posBtn = screen.getByRole('button', { name: /venta rápida/i })
    fireEvent.click(posBtn)
    expect(mockNavigate).toHaveBeenCalledWith('pos')

    const stockBtn = screen.getByRole('button', { name: /ingreso stock/i })
    fireEvent.click(stockBtn)
    expect(mockNavigate).toHaveBeenCalledWith('entries')
  })

  it('should show recent sales table with customer and amounts', () => {
    render(
      <DashboardView
        products={mockProducts}
        receipts={mockReceipts}
        onNavigate={mockNavigate}
      />
    )

    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    expect(screen.getByText(/últimas ventas/i)).toBeInTheDocument()
  })

  it('should display positive message when all products have sufficient stock', () => {
    const optimalProducts = [
      new Product({
        id: 'p-opt',
        name: 'Tornillo 2"',
        price: 100,
        cost: 50,
        stock: 50,
      }),
    ]

    render(
      <DashboardView
        products={optimalProducts}
        receipts={[]}
        onNavigate={mockNavigate}
      />
    )

    expect(screen.getByText(/todos los artículos tienen stock suficiente/i)).toBeInTheDocument()
  })
})
