import { describe, it, expect, beforeEach } from 'vitest'
import { RegisterStockEntryUseCase } from './register-stock-entry'
import { InMemoryProductRepository, InMemoryStockMovementRepository, InMemorySupplierRepository } from '@/test/in-memory-repositories'
import { Product, Supplier } from '../domain/entities'
import { EntityNotFoundError, ValidationError } from '../domain/errors'

describe('RegisterStockEntryUseCase', () => {
  let productRepo: InMemoryProductRepository
  let movementRepo: InMemoryStockMovementRepository
  let supplierRepo: InMemorySupplierRepository
  let useCase: RegisterStockEntryUseCase

  beforeEach(async () => {
    productRepo = new InMemoryProductRepository()
    movementRepo = new InMemoryStockMovementRepository()
    supplierRepo = new InMemorySupplierRepository()
    useCase = new RegisterStockEntryUseCase(productRepo, movementRepo, supplierRepo)

    await productRepo.save(new Product({
      id: 'prod-entry-1',
      name: 'Disco de Desbaste 4.5"',
      price: 1500,
      cost: 700,
      stock: 10,
      barcode: '7791234567890',
    }))

    await supplierRepo.save(new Supplier({
      id: 'sup-entry-1',
      name: 'Abrasivos Argentinos S.A.',
    }))
  })

  it('should increase stock, update cost and record stock movement with supplier', async () => {
    const entryDate = new Date('2026-10-01T10:00:00Z')

    const result = await useCase.execute({
      productId: 'prod-entry-1',
      quantity: 25,
      supplierId: 'sup-entry-1',
      cost: 750, // Costo actualizado por inflación/lista nueva
      reason: 'Factura A-0001-00045231',
      date: entryDate,
    })

    expect(result.stock).toBe(35) // 10 + 25
    expect(result.cost).toBe(750)

    // Verificar persistencia del producto
    const updatedProduct = await productRepo.findById('prod-entry-1')
    expect(updatedProduct?.stock).toBe(35)
    expect(updatedProduct?.cost).toBe(750)

    // Verificar registro del movimiento de stock
    const movements = await movementRepo.findByProductId('prod-entry-1')
    expect(movements).toHaveLength(1)
    expect(movements[0].type).toBe('IN')
    expect(movements[0].quantity).toBe(25)
    expect(movements[0].supplierId).toBe('sup-entry-1')
    expect(movements[0].reason).toBe('Factura A-0001-00045231')
    expect(movements[0].date).toEqual(entryDate)
  })

  it('should allow entry without supplier or cost update', async () => {
    const result = await useCase.execute({
      productId: 'prod-entry-1',
      quantity: 5,
    })

    expect(result.stock).toBe(15)
    expect(result.cost).toBe(700) // Mantiene costo original

    const movements = await movementRepo.findByProductId('prod-entry-1')
    expect(movements[0].type).toBe('IN')
    expect(movements[0].supplierId).toBeUndefined()
  })

  it('should throw EntityNotFoundError if product does not exist', async () => {
    await expect(
      useCase.execute({
        productId: 'prod-inexistente',
        quantity: 10,
      })
    ).rejects.toThrow(EntityNotFoundError)
  })

  it('should throw ValidationError if quantity is not positive integer', async () => {
    await expect(
      useCase.execute({
        productId: 'prod-entry-1',
        quantity: 0,
      })
    ).rejects.toThrow(ValidationError)

    await expect(
      useCase.execute({
        productId: 'prod-entry-1',
        quantity: -10,
      })
    ).rejects.toThrow(ValidationError)

    await expect(
      useCase.execute({
        productId: 'prod-entry-1',
        quantity: 4.5,
      })
    ).rejects.toThrow(ValidationError)
  })

  it('should throw ValidationError if updated cost is negative', async () => {
    await expect(
      useCase.execute({
        productId: 'prod-entry-1',
        quantity: 10,
        cost: -100,
      })
    ).rejects.toThrow(ValidationError)
  })
})
