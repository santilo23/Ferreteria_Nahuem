import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SalesHistoryView } from './sales-history-view'
import { Product, Receipt, ReceiptItem } from '@/core/domain/entities'

describe('SalesHistoryView Component', () => {
  const mockProducts = [
    new Product({
      id: 'p-1',
      name: 'Tornillo 1"',
      price: 1500,
      cost: 750,
      stock: 30,
    }),
  ]

  const mockReceipt1 = new Receipt({
    id: 'rec-001',
    customerName: 'Juan Carlos',
    items: [
      new ReceiptItem({
        id: 'i-1',
        receiptId: 'rec-001',
        productId: 'p-1',
        quantity: 2,
        unitPrice: 1500,
      }),
    ],
    date: new Date('2026-09-30T10:00:00'),
    status: 'COMPLETED',
  })

  const mockReceipt2 = new Receipt({
    id: 'rec-002',
    customerName: 'María López',
    items: [
      new ReceiptItem({
        id: 'i-2',
        receiptId: 'rec-002',
        productId: 'p-1',
        quantity: 1,
        unitPrice: 1500,
      }),
    ],
    date: new Date('2026-09-30T11:00:00'),
    status: 'CANCELLED',
    cancelReason: 'Error de cobro',
  })

  const mockReceipts = [mockReceipt1, mockReceipt2]

  const mockViewReceipt = vi.fn()
  const mockVoidSale = vi.fn().mockResolvedValue(undefined)
  const mockNavigate = vi.fn()

  it('should render table with sales list and customer names', () => {
    render(
      <SalesHistoryView
        receipts={mockReceipts}
        products={mockProducts}
        onViewReceipt={mockViewReceipt}
        onVoidSale={mockVoidSale}
        onNavigate={mockNavigate}
      />
    )

    expect(screen.getByText('Juan Carlos')).toBeInTheDocument()
    expect(screen.getByText('María López')).toBeInTheDocument()
    expect(screen.getByText(/completada/i)).toBeInTheDocument()
    expect(screen.getAllByText(/anulada/i).length).toBeGreaterThanOrEqual(1)
  })

  it('should trigger onViewReceipt when clicking "Ver / Reimprimir"', () => {
    render(
      <SalesHistoryView
        receipts={mockReceipts}
        products={mockProducts}
        onViewReceipt={mockViewReceipt}
        onVoidSale={mockVoidSale}
        onNavigate={mockNavigate}
      />
    )

    const viewButtons = screen.getAllByRole('button', { name: /reimprimir/i })
    fireEvent.click(viewButtons[0])

    expect(mockViewReceipt).toHaveBeenCalledWith(mockReceipt1)
  })

  it('should open void dialog and call onVoidSale when confirming void', async () => {
    render(
      <SalesHistoryView
        receipts={mockReceipts}
        products={mockProducts}
        onViewReceipt={mockViewReceipt}
        onVoidSale={mockVoidSale}
        onNavigate={mockNavigate}
      />
    )

    // Find the void button for the active receipt
    const voidBtn = screen.getByRole('button', { name: /anular venta/i })
    fireEvent.click(voidBtn)

    // Confirmation dialog appears
    expect(screen.getByText(/¿deseas anular esta venta\?/i)).toBeInTheDocument()

    // Enter a reason
    const reasonInput = screen.getByPlaceholderText(/error de cobranza/i)
    fireEvent.change(reasonInput, { target: { value: 'Error en cantidad' } })

    // Click confirm void
    const confirmBtn = screen.getByRole('button', { name: /confirmar anulación/i })
    fireEvent.click(confirmBtn)

    expect(mockVoidSale).toHaveBeenCalledWith('rec-001', 'Error en cantidad')
  })

  it('should filter sales by status (Activas / Anuladas)', () => {
    render(
      <SalesHistoryView
        receipts={mockReceipts}
        products={mockProducts}
        onViewReceipt={mockViewReceipt}
        onVoidSale={mockVoidSale}
        onNavigate={mockNavigate}
      />
    )

    // Filter by Anuladas
    const anuladasFilter = screen.getByRole('button', { name: /anuladas \(1\)/i })
    fireEvent.click(anuladasFilter)

    expect(screen.queryByText('Juan Carlos')).not.toBeInTheDocument()
    expect(screen.getByText('María López')).toBeInTheDocument()
  })
})
