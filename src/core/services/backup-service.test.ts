import { describe, it, expect } from 'vitest'
import { BackupService } from './backup-service'
import { Product, Supplier, StockMovement, Receipt, ReceiptItem } from '../domain/entities'
import { ValidationError } from '../domain/errors'

describe('BackupService', () => {
  const mockProducts = [
    new Product({
      id: 'p-1',
      name: 'Tornillo 1"',
      description: 'Caja x 100u',
      price: 1500,
      cost: 750,
      stock: 40,
      barcode: '7791234567890',
    }),
  ]

  const mockSuppliers = [
    new Supplier({
      id: 's-1',
      name: 'Bulonera Central',
      contact: 'Carlos',
      phone: '11-2233-4455',
      email: 'carlos@central.com',
      address: 'Av. Libertador 1000',
    }),
  ]

  const mockMovements = [
    new StockMovement({
      id: 'm-1',
      productId: 'p-1',
      type: 'IN',
      quantity: 50,
      reason: 'Compra inicial',
      date: new Date('2026-09-30T10:00:00Z'),
    }),
  ]

  const mockReceipts = [
    new Receipt({
      id: 'rec-1',
      customerName: 'Juan Pérez',
      date: new Date('2026-09-30T14:30:00Z'),
      items: [
        new ReceiptItem({
          id: 'item-1',
          receiptId: 'rec-1',
          productId: 'p-1',
          quantity: 2,
          unitPrice: 1500,
        }),
      ],
    }),
  ]

  it('should export all system data to valid JSON string and re-import correctly into domain entities', () => {
    const jsonString = BackupService.exportToJson({
      products: mockProducts,
      suppliers: mockSuppliers,
      movements: mockMovements,
      receipts: mockReceipts,
    })

    expect(typeof jsonString).toBe('string')
    const parsed = JSON.parse(jsonString)
    expect(parsed.version).toBe('1.0')
    expect(parsed.products).toHaveLength(1)
    expect(parsed.products[0].name).toBe('Tornillo 1"')
    expect(parsed.receipts).toHaveLength(1)
    expect(parsed.receipts[0].items).toHaveLength(1)

    // Re-import from JSON
    const restored = BackupService.importFromJson(jsonString)
    expect(restored.products).toHaveLength(1)
    expect(restored.products[0]).toBeInstanceOf(Product)
    expect(restored.products[0].name).toBe('Tornillo 1"')
    expect(restored.products[0].stock).toBe(40)

    expect(restored.suppliers).toHaveLength(1)
    expect(restored.suppliers[0]).toBeInstanceOf(Supplier)
    expect(restored.suppliers[0].name).toBe('Bulonera Central')

    expect(restored.movements).toHaveLength(1)
    expect(restored.movements[0]).toBeInstanceOf(StockMovement)

    expect(restored.receipts).toHaveLength(1)
    expect(restored.receipts[0]).toBeInstanceOf(Receipt)
    expect(restored.receipts[0].items[0]).toBeInstanceOf(ReceiptItem)
    expect(restored.receipts[0].totalAmount).toBe(3000)
  })

  it('should throw ValidationError when importing invalid or corrupted JSON', () => {
    expect(() => BackupService.importFromJson('not a json')).toThrow(ValidationError)
    expect(() => BackupService.importFromJson('{}')).toThrow(ValidationError)
    expect(() => BackupService.importFromJson('{"products": "invalid"}')).toThrow(ValidationError)
  })

  it('should export products to Excel-compatible CSV string with headers and escaped commas', () => {
    const csv = BackupService.exportProductsToCsv(mockProducts)

    expect(csv).toContain('Código de Barras;Nombre;Descripción;Precio Venta;Costo;Stock')
    expect(csv).toContain('7791234567890')
    expect(csv).toContain('Tornillo 1"')
    expect(csv).toContain('1500')
  })

  it('should export sales history to Excel-compatible CSV string with headers and status', () => {
    const csv = BackupService.exportSalesToCsv(mockReceipts)

    expect(csv).toContain('Ticket;Fecha;Hora;Cliente;Total;Estado;Cant Ítems')
    expect(csv).toContain('REC-1')
    expect(csv).toContain('Juan Pérez')
    expect(csv).toContain('3000')
    expect(csv).toContain('COMPLETED')
  })
})
