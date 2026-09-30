import { describe, it, expect } from 'vitest'
import { Receipt, ReceiptItem } from './receipt'
import { ValidationError } from '../errors'

describe('Receipt and ReceiptItem Entities', () => {
  it('should create a valid ReceiptItem and compute subtotal', () => {
    const item = new ReceiptItem({
      id: 'item-1',
      receiptId: 'rec-1',
      productId: 'prod-1',
      quantity: 3,
      unitPrice: 1500,
    })

    expect(item.id).toBe('item-1')
    expect(item.receiptId).toBe('rec-1')
    expect(item.productId).toBe('prod-1')
    expect(item.quantity).toBe(3)
    expect(item.unitPrice).toBe(1500)
    expect(item.subtotal).toBe(4500)
  })

  it('should throw ValidationError if item quantity is zero or negative', () => {
    expect(() => new ReceiptItem({
      id: 'item-2',
      receiptId: 'rec-1',
      productId: 'prod-1',
      quantity: 0,
      unitPrice: 100,
    })).toThrow(ValidationError)

    expect(() => new ReceiptItem({
      id: 'item-3',
      receiptId: 'rec-1',
      productId: 'prod-1',
      quantity: -2,
      unitPrice: 100,
    })).toThrow(ValidationError)
  })

  it('should throw ValidationError if item unitPrice is negative', () => {
    expect(() => new ReceiptItem({
      id: 'item-4',
      receiptId: 'rec-1',
      productId: 'prod-1',
      quantity: 1,
      unitPrice: -10,
    })).toThrow(ValidationError)
  })

  it('should create a valid Receipt and compute totalAmount automatically from items', () => {
    const item1 = new ReceiptItem({
      id: 'item-1',
      receiptId: 'rec-1',
      productId: 'prod-1',
      quantity: 2,
      unitPrice: 1000, // 2000
    })

    const item2 = new ReceiptItem({
      id: 'item-2',
      receiptId: 'rec-1',
      productId: 'prod-2',
      quantity: 3,
      unitPrice: 500, // 1500
    })

    const receipt = new Receipt({
      id: 'rec-1',
      customerName: 'Consumidor Final',
      items: [item1, item2],
    })

    expect(receipt.id).toBe('rec-1')
    expect(receipt.customerName).toBe('Consumidor Final')
    expect(receipt.items).toHaveLength(2)
    expect(receipt.totalAmount).toBe(3500)
    expect(receipt.date).toBeInstanceOf(Date)
  })

  it('should throw ValidationError if receipt has no items', () => {
    expect(() => new Receipt({
      id: 'rec-2',
      items: [],
    })).toThrow(ValidationError)
  })

  it('should have status COMPLETED by default and allow cancellation', () => {
    const item = new ReceiptItem({
      id: 'item-1',
      receiptId: 'rec-1',
      productId: 'prod-1',
      quantity: 1,
      unitPrice: 500,
    })

    const receipt = new Receipt({
      id: 'rec-1',
      items: [item],
    })

    expect(receipt.status).toBe('COMPLETED')
    expect(receipt.cancelledAt).toBeUndefined()
    expect(receipt.cancelReason).toBeUndefined()

    receipt.cancel('Devolución de mercadería')

    expect(receipt.status).toBe('CANCELLED')
    expect(receipt.cancelledAt).toBeInstanceOf(Date)
    expect(receipt.cancelReason).toBe('Devolución de mercadería')

    // Cannot cancel again
    expect(() => receipt.cancel()).toThrow(ValidationError)
  })
})
