import { describe, it, expect, beforeEach } from 'vitest'
import { UpdateStockUseCase } from './update-stock'
import { InMemoryProductRepository, InMemoryStockMovementRepository } from '@/test/in-memory-repositories'
import { Product } from '../domain/entities'
import { EntityNotFoundError, InsufficientStockError, ValidationError } from '../domain/errors'

describe('UpdateStockUseCase', () => {
  let productRepo: InMemoryProductRepository
  let movementRepo: InMemoryStockMovementRepository
  let useCase: UpdateStockUseCase

  beforeEach(async () => {
    productRepo = new InMemoryProductRepository()
    movementRepo = new InMemoryStockMovementRepository()
    useCase = new UpdateStockUseCase(productRepo, movementRepo)

    await productRepo.save(new Product({
      id: 'prod-stock-1',
      name: 'Tornillo Madera 1.5"',
      price: 25,
      cost: 12,
      stock: 50,
    }))
  })

  it('should increase stock on IN movement and persist movement record', async () => {
    const updated = await useCase.execute({
      productId: 'prod-stock-1',
      type: 'IN',
      quantity: 30,
      supplierId: 'sup-1',
      reason: 'Recepción remito 4059',
    })

    expect(updated.stock).toBe(80)

    const savedProduct = await productRepo.findById('prod-stock-1')
    expect(savedProduct?.stock).toBe(80)

    const movements = await movementRepo.findByProductId('prod-stock-1')
    expect(movements).toHaveLength(1)
    expect(movements[0].type).toBe('IN')
    expect(movements[0].quantity).toBe(30)
    expect(movements[0].supplierId).toBe('sup-1')
  })

  it('should decrease stock on OUT movement and record movement', async () => {
    const updated = await useCase.execute({
      productId: 'prod-stock-1',
      type: 'OUT',
      quantity: 15,
      reason: 'Venta por mostrador',
    })

    expect(updated.stock).toBe(35)

    const movements = await movementRepo.findByProductId('prod-stock-1')
    expect(movements).toHaveLength(1)
    expect(movements[0].type).toBe('OUT')
    expect(movements[0].quantity).toBe(15)
  })

  it('should throw InsufficientStockError if OUT quantity exceeds current stock', async () => {
    await expect(
      useCase.execute({
        productId: 'prod-stock-1',
        type: 'OUT',
        quantity: 100, // Stock es 50
      })
    ).rejects.toThrow(InsufficientStockError)

    // Stock no debe haber cambiado
    const product = await productRepo.findById('prod-stock-1')
    expect(product?.stock).toBe(50)
  })

  it('should throw EntityNotFoundError if product does not exist', async () => {
    await expect(
      useCase.execute({
        productId: 'prod-inexistente',
        type: 'IN',
        quantity: 10,
      })
    ).rejects.toThrow(EntityNotFoundError)
  })

  it('should throw ValidationError if quantity is not positive integer', async () => {
    await expect(
      useCase.execute({
        productId: 'prod-stock-1',
        type: 'IN',
        quantity: -5,
      })
    ).rejects.toThrow(ValidationError)
  })
})
