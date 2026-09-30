import { describe, it, expect, beforeEach } from 'vitest'
import prisma from '../database/prisma'
import { PrismaStockMovementRepository } from './prisma-stock-movement-repository'
import { StockMovement } from '@/core/domain/entities'

describe('PrismaStockMovementRepository Integration', () => {
  const repository = new PrismaStockMovementRepository(prisma)

  beforeEach(async () => {
    await prisma.stockMovement.deleteMany()
    await prisma.receiptItem.deleteMany()
    await prisma.product.deleteMany()
    await prisma.supplier.deleteMany()

    // Pre-create product for FK relation
    await prisma.product.create({
      data: {
        id: 'prod-mov-test',
        name: 'Disco de Corte 4.5"',
        price: 900,
        cost: 450,
        stock: 50,
      },
    })
  })

  it('should save and retrieve stock movements for a product', async () => {
    const movement = new StockMovement({
      id: 'mov-test-1',
      productId: 'prod-mov-test',
      type: 'IN',
      quantity: 20,
      reason: 'Ingreso por compra',
    })

    await repository.save(movement)

    const movements = await repository.findByProductId('prod-mov-test')
    expect(movements).toHaveLength(1)
    expect(movements[0].id).toBe('mov-test-1')
    expect(movements[0].productId).toBe('prod-mov-test')
    expect(movements[0].type).toBe('IN')
    expect(movements[0].quantity).toBe(20)
  })
})
