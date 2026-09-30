import { describe, it, expect } from 'vitest'
import { Product } from './product'
import { ValidationError, InsufficientStockError } from '../errors'

describe('Product Entity', () => {
  it('should create a valid product with all properties', () => {
    const product = new Product({
      id: 'prod-1',
      name: 'Tornillo Phillips 2"',
      description: 'Caja x 100 unidades',
      price: 1500,
      cost: 800,
      stock: 25,
      barcode: '7791234567890',
      categoryId: 'cat-tornillos',
    })

    expect(product.id).toBe('prod-1')
    expect(product.name).toBe('Tornillo Phillips 2"')
    expect(product.description).toBe('Caja x 100 unidades')
    expect(product.price).toBe(1500)
    expect(product.cost).toBe(800)
    expect(product.stock).toBe(25)
    expect(product.barcode).toBe('7791234567890')
    expect(product.categoryId).toBe('cat-tornillos')
  })

  it('should create a valid product without optional fields', () => {
    const product = new Product({
      id: 'prod-2',
      name: 'Arandela 1/4',
      price: 100,
      cost: 50,
      stock: 0,
    })

    expect(product.barcode).toBeUndefined()
    expect(product.description).toBeUndefined()
    expect(product.categoryId).toBeUndefined()
    expect(product.stock).toBe(0)
  })

  it('should throw ValidationError if name is empty or only whitespace', () => {
    expect(() => new Product({
      id: 'prod-3',
      name: '   ',
      price: 100,
      cost: 50,
      stock: 5,
    })).toThrow(ValidationError)
  })

  it('should throw ValidationError if price is negative', () => {
    expect(() => new Product({
      id: 'prod-4',
      name: 'Clavos 2"',
      price: -10,
      cost: 50,
      stock: 5,
    })).toThrow(ValidationError)
  })

  it('should throw ValidationError if cost is negative', () => {
    expect(() => new Product({
      id: 'prod-5',
      name: 'Clavos 2"',
      price: 100,
      cost: -5,
      stock: 5,
    })).toThrow(ValidationError)
  })

  it('should throw ValidationError if initial stock is negative', () => {
    expect(() => new Product({
      id: 'prod-6',
      name: 'Clavos 2"',
      price: 100,
      cost: 50,
      stock: -1,
    })).toThrow(ValidationError)
  })

  describe('Stock Operations', () => {
    it('should increase stock correctly', () => {
      const product = new Product({
        id: 'prod-7',
        name: 'Tuerca 3/8',
        price: 80,
        cost: 40,
        stock: 10,
      })

      product.increaseStock(15)
      expect(product.stock).toBe(25)
    })

    it('should throw ValidationError when increasing by non-positive quantity', () => {
      const product = new Product({
        id: 'prod-8',
        name: 'Tuerca 3/8',
        price: 80,
        cost: 40,
        stock: 10,
      })

      expect(() => product.increaseStock(0)).toThrow(ValidationError)
      expect(() => product.increaseStock(-5)).toThrow(ValidationError)
    })

    it('should decrease stock correctly', () => {
      const product = new Product({
        id: 'prod-9',
        name: 'Tuerca 3/8',
        price: 80,
        cost: 40,
        stock: 10,
      })

      product.decreaseStock(4)
      expect(product.stock).toBe(6)
    })

    it('should throw InsufficientStockError if decrease exceeds current stock', () => {
      const product = new Product({
        id: 'prod-10',
        name: 'Tuerca 3/8',
        price: 80,
        cost: 40,
        stock: 5,
      })

      expect(() => product.decreaseStock(6)).toThrow(InsufficientStockError)
    })

    it('should throw ValidationError when decreasing by non-positive quantity', () => {
      const product = new Product({
        id: 'prod-11',
        name: 'Tuerca 3/8',
        price: 80,
        cost: 40,
        stock: 5,
      })

      expect(() => product.decreaseStock(0)).toThrow(ValidationError)
      expect(() => product.decreaseStock(-2)).toThrow(ValidationError)
    })
  })
})
