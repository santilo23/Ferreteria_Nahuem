import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReceiptDialog } from './receipt-dialog'
import { ProcessSaleResult } from '@/core/use-cases'
import { Receipt, ReceiptItem } from '@/core/domain/entities'
import { PrintService } from '@/presentation/lib/print-service'

describe('ReceiptDialog Component (Print & Thermal Layout)', () => {
  const mockItem = new ReceiptItem({
    id: 'item-1',
    receiptId: 'rec-test-1234',
    productId: 'p-1',
    quantity: 2,
    unitPrice: 1500,
  })

  const mockReceipt = new Receipt({
    id: 'rec-test-1234',
    customerName: 'Juan Carlos',
    items: [mockItem],
    date: new Date('2026-10-01T15:30:00Z'),
  })

  const mockSaleResult: ProcessSaleResult = {
    receipt: mockReceipt,
    updatedProducts: [],
    change: 500,
    ticketText: 'FERRETERIA NAHUEM TICKET DEMO',
  }

  const mockClose = vi.fn()

  it('should render printable receipt modal with ticket data', () => {
    render(<ReceiptDialog saleResult={mockSaleResult} open={true} onClose={mockClose} />)

    expect(screen.getByText(/Ferretería Nahuem/i)).toBeInTheDocument()
    expect(screen.getByText(/Juan Carlos/i)).toBeInTheDocument()
    expect(screen.getByText(/TOTAL A PAGAR:/i)).toBeInTheDocument()
    expect(screen.getAllByText('$3.000,00').length).toBeGreaterThan(0)
    expect(screen.getByText(/COMPROBANTE NO FISCAL/i)).toBeInTheDocument()
  })

  it('should trigger PrintService.printHtml when "Imprimir Comprobante" is clicked', () => {
    const printSpy = vi.spyOn(PrintService, 'printHtml').mockImplementation(() => {})

    render(<ReceiptDialog saleResult={mockSaleResult} open={true} onClose={mockClose} />)

    const printBtn = screen.getByRole('button', { name: /imprimir comprobante/i })
    fireEvent.click(printBtn)

    expect(printSpy).toHaveBeenCalled()
    printSpy.mockRestore()
  })

  it('should trigger PrintService.downloadTicketFile when "Descargar" is clicked', () => {
    const downloadSpy = vi.spyOn(PrintService, 'downloadTicketFile').mockImplementation(() => {})

    render(<ReceiptDialog saleResult={mockSaleResult} open={true} onClose={mockClose} />)

    const downloadBtn = screen.getByRole('button', { name: /descargar/i })
    fireEvent.click(downloadBtn)

    expect(downloadSpy).toHaveBeenCalled()
    downloadSpy.mockRestore()
  })
})
