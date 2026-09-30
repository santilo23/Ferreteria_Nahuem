import { describe, it, expect } from 'vitest'
import { StockMovement } from './stock-movement'
import { ValidationError } from '../errors'

describe('StockMovement Entity', () => {
  it('should create a valid IN stock movement', () => {
    const movement = new StockMovement({
      id: 'mov-1',
      productId: 'prod-1',
      supplierId: 'sup-1',
      type: 'IN',
      quantity: 50,
      reason: 'Compra de reposición factura A-0001',
    })

    expect(movement.id).toBe('mov-1')
    expect(movement.productId).toBe('prod-1')
    expect(movement.supplierId).toBe('sup-1')
    expect(movement.type).toBe('IN')
    expect(movement.quantity).toBe(50)
    expect(movement.reason).toBe('Compra de reposición factura A-0001')
    expect(movement.date).toBeInstanceOf(Date)
  })

  it('should create a valid OUT stock movement without supplier', () => {
    const movement = new StockMovement({
      id: 'mov-2',
      productId: 'prod-1',
      type: 'OUT',
      quantity: 3,
      reason: 'Venta ticket #102',
    })

    expect(movement.type).toBe('OUT')
    expect(movement.supplierId).toBeUndefined()
    expect(movement.quantity).toBe(3)
  })

  it('should throw ValidationError if productId is empty', () => {
    expect(() => new StockMovement({
      id: 'mov-3',
      productId: '   ',
      type: 'IN',
      quantity: 10,
    })).toThrow(ValidationError)
  })

  it('should throw ValidationError if quantity is zero or negative', () => {
    expect(() => new StockMovement({
      id: 'mov-4',
      productId: 'prod-1',
      type: 'IN',
      quantity: 0,
    })).toThrow(ValidationError)

    expect(() => new StockMovement({
      id: 'mov-5',
      productId: 'prod-1',
      type: 'IN',
      quantity: -5,
    })).toThrow(ValidationError)
  })

  it('should throw ValidationError if quantity is not an integer', () => {
    expect(() => new StockMovement({
      id: 'mov-6',
      productId: 'prod-1',
      type: 'IN',
      quantity: 2.5,
    })).toThrow(ValidationError)
  })

  it('should throw ValidationError if type is invalid', () => {
    expect(() => new StockMovement({
      id: 'mov-7',
      productId: 'prod-1',
      // @ts-expect-error testing invalid runtime value
      type: 'INVALID_TYPE',
      quantity: 10,
    })).toThrow(ValidationError)
  })
})
