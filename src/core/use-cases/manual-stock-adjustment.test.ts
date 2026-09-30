import { describe, it, expect, beforeEach } from 'vitest'
import { ManualStockAdjustmentUseCase } from './manual-stock-adjustment'
import { InMemoryProductRepository, InMemoryStockMovementRepository } from '@/test/in-memory-repositories'
import { Product } from '../domain/entities'
import { EntityNotFoundError, InsufficientStockError, ValidationError } from '../domain/errors'

describe('ManualStockAdjustmentUseCase', () => {
  let productRepo: InMemoryProductRepository
  let movementRepo: InMemoryStockMovementRepository
  let useCase: ManualStockAdjustmentUseCase

  beforeEach(async () => {
    productRepo = new InMemoryProductRepository()
    movementRepo = new InMemoryStockMovementRepository()
    useCase = new ManualStockAdjustmentUseCase(productRepo, movementRepo)

    await productRepo.save(new Product({
      id: 'prod-adj-1',
      name: 'Adhesivo de Contacto 500ml',
      price: 4500,
      cost: 2300,
      stock: 20,
    }))
  })

  it('should adjust stock by setting absolute count and record MANUAL movement', async () => {
    const result = await useCase.execute({
      productId: 'prod-adj-1',
      mode: 'SET',
      quantity: 18, // Conteo físico encontró 18 en vez de 20
      reason: 'Ajuste por inventario físico mensual',
    })

    expect(result.stock).toBe(18)

    const movements = await movementRepo.findByProductId('prod-adj-1')
    expect(movements).toHaveLength(1)
    expect(movements[0].type).toBe('MANUAL')
    expect(movements[0].reason).toContain('Ajuste por inventario físico mensual')
  })

  it('should subtract stock for breakage / damage and record reason', async () => {
    const result = await useCase.execute({
      productId: 'prod-adj-1',
      mode: 'SUBTRACT',
      quantity: 2,
      reason: 'Lata abollada con pérdida de líquido',
    })

    expect(result.stock).toBe(18) // 20 - 2

    const movements = await movementRepo.findByProductId('prod-adj-1')
    expect(movements[0].quantity).toBe(2)
    expect(movements[0].type).toBe('MANUAL')
    expect(movements[0].reason).toBe('Lata abollada con pérdida de líquido')
  })

  it('should require a reason for manual adjustment', async () => {
    await expect(
      useCase.execute({
        productId: 'prod-adj-1',
        mode: 'SUBTRACT',
        quantity: 1,
        reason: '   ', // Motivo vacío
      })
    ).rejects.toThrow(ValidationError)
  })

  it('should prevent stock from becoming negative when subtracting', async () => {
    await expect(
      useCase.execute({
        productId: 'prod-adj-1',
        mode: 'SUBTRACT',
        quantity: 30, // Stock es 20
        reason: 'Pérdida en depósito',
      })
    ).rejects.toThrow(InsufficientStockError)
  })

  it('should throw EntityNotFoundError if product does not exist', async () => {
    await expect(
      useCase.execute({
        productId: 'prod-inexistente',
        mode: 'ADD',
        quantity: 5,
        reason: 'Ingreso manual',
      })
    ).rejects.toThrow(EntityNotFoundError)
  })
})
