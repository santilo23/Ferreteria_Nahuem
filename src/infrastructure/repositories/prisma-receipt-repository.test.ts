import { describe, it, expect, beforeEach } from 'vitest'
import prisma from '../database/prisma'
import { PrismaReceiptRepository } from './prisma-receipt-repository'
import { Receipt, ReceiptItem } from '@/core/domain/entities'

describe('PrismaReceiptRepository Integration', () => {
  const repository = new PrismaReceiptRepository(prisma)

  beforeEach(async () => {
    await prisma.receiptItem.deleteMany()
    await prisma.receipt.deleteMany()
    await prisma.stockMovement.deleteMany()
    await prisma.product.deleteMany()

    // Create products for receipt items FK
    await prisma.product.create({
      data: {
        id: 'prod-rec-1',
        name: 'Electrodos 2.5mm',
        price: 8000,
        cost: 4500,
        stock: 30,
      },
    })
  })

  it('should save a receipt with items and find it by id', async () => {
    const item = new ReceiptItem({
      id: 'item-rec-1',
      receiptId: 'rec-test-1',
      productId: 'prod-rec-1',
      quantity: 2,
      unitPrice: 8000,
    })

    const receipt = new Receipt({
      id: 'rec-test-1',
      customerName: 'Juan Mecánico',
      items: [item],
    })

    await repository.save(receipt)

    const found = await repository.findById('rec-test-1')
    expect(found).not.toBeNull()
    expect(found?.id).toBe('rec-test-1')
    expect(found?.customerName).toBe('Juan Mecánico')
    expect(found?.totalAmount).toBe(16000)
    expect(found?.items).toHaveLength(1)
    expect(found?.items[0].subtotal).toBe(16000)
  })
})
