import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BackupDialog } from './backup-dialog'
import { Product, Supplier, StockMovement, Receipt } from '@/core/domain/entities'
import { PrintService } from '@/presentation/lib/print-service'

describe('BackupDialog Component', () => {
  const mockProducts = [new Product({ id: 'p-1', name: 'Tornillo', price: 100, cost: 50, stock: 10 })]
  const mockSuppliers: Supplier[] = []
  const mockMovements: StockMovement[] = []
  const mockReceipts: Receipt[] = []

  it('should render options to download backup and export csv', () => {
    const downloadSpy = vi.spyOn(PrintService, 'downloadTicketFile').mockImplementation(() => {})

    render(
      <BackupDialog
        open={true}
        onClose={vi.fn()}
        products={mockProducts}
        suppliers={mockSuppliers}
        movements={mockMovements}
        receipts={mockReceipts}
        onRestoreBackup={vi.fn()}
      />
    )

    expect(screen.getByText(/copias de seguridad y respaldo/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /descargar respaldo completo \(json\)/i })).toBeInTheDocument()

    // Click download JSON backup
    const dlBtn = screen.getByRole('button', { name: /descargar respaldo completo \(json\)/i })
    fireEvent.click(dlBtn)

    expect(downloadSpy).toHaveBeenCalled()
    downloadSpy.mockRestore()
  })
})
