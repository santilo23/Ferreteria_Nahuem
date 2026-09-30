import { describe, it, expect, beforeEach } from 'vitest'
import { PosCart } from './cart'
import { Product } from '../entities'
import { InsufficientStockError, ValidationError } from '../errors'

describe('PosCart Domain Model', () => {
  let cart: PosCart
  let productA: Product
  let productB: Product

  beforeEach(() => {
    cart = new PosCart()

    productA = new Product({
      id: 'p-cart-1',
      name: 'Tornillo 2"',
      price: 150,
      cost: 70,
      stock: 10,
    })

    productB = new Product({
      id: 'p-cart-2',
      name: 'Tuerca 3/8',
      price: 50,
      cost: 20,
      stock: 5,
    })
  })

  it('should initialize empty with zero total', () => {
    expect(cart.items).toHaveLength(0)
    expect(cart.total).toBe(0)
  })

  it('should add products and calculate subtotals and grand total', () => {
    cart.addItem(productA, 2) // 2 * 150 = 300
    cart.addItem(productB, 3) // 3 * 50 = 150

    expect(cart.items).toHaveLength(2)
    expect(cart.items[0].subtotal).toBe(300)
    expect(cart.items[1].subtotal).toBe(150)
    expect(cart.total).toBe(450)
  })

  it('should increment quantity when adding an already existing product', () => {
    cart.addItem(productA, 2)
    cart.addItem(productA, 3)

    expect(cart.items).toHaveLength(1)
    expect(cart.items[0].quantity).toBe(5)
    expect(cart.items[0].subtotal).toBe(750) // 5 * 150
    expect(cart.total).toBe(750)
  })

  it('should throw InsufficientStockError if adding quantity exceeding available stock', () => {
    expect(() => cart.addItem(productB, 6)).toThrow(InsufficientStockError)
  })

  it('should throw InsufficientStockError if cumulative additions exceed stock', () => {
    cart.addItem(productB, 4) // Stock es 5
    expect(() => cart.addItem(productB, 2)).toThrow(InsufficientStockError)
  })

  it('should throw ValidationError if adding product with 0 stock', () => {
    const outOfStockProduct = new Product({
      id: 'p-out',
      name: 'Sin Stock',
      price: 100,
      cost: 50,
      stock: 0,
    })

    expect(() => cart.addItem(outOfStockProduct, 1)).toThrow(ValidationError)
  })

  it('should update item quantity and update total', () => {
    cart.addItem(productA, 2)
    cart.updateQuantity(productA.id, 5)

    expect(cart.items[0].quantity).toBe(5)
    expect(cart.total).toBe(750)
  })

  it('should remove item when quantity is updated to 0', () => {
    cart.addItem(productA, 2)
    cart.updateQuantity(productA.id, 0)

    expect(cart.items).toHaveLength(0)
    expect(cart.total).toBe(0)
  })

  it('should remove item by product id', () => {
    cart.addItem(productA, 2)
    cart.addItem(productB, 1)

    cart.removeItem(productA.id)

    expect(cart.items).toHaveLength(1)
    expect(cart.items[0].productId).toBe(productB.id)
    expect(cart.total).toBe(50)
  })

  it('should clear all items in the cart', () => {
    cart.addItem(productA, 1)
    cart.addItem(productB, 1)
    cart.clear()

    expect(cart.items).toHaveLength(0)
    expect(cart.total).toBe(0)
  })
})
