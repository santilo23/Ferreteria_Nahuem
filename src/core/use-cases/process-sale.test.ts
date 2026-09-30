import { describe, it, expect, beforeEach } from 'vitest'
import { ProcessSaleUseCase } from './process-sale'
import { InMemoryProductRepository, InMemoryStockMovementRepository, InMemoryReceiptRepository } from '@/test/in-memory-repositories'
import { Product } from '../domain/entities'
import { InsufficientStockError, ValidationError } from '../domain/errors'

describe('ProcessSaleUseCase', () => {
  let productRepo: InMemoryProductRepository
  let movementRepo: InMemoryStockMovementRepository
  let receiptRepo: InMemoryReceiptRepository
  let useCase: ProcessSaleUseCase

  let productA: Product
  let productB: Product

  beforeEach(async () => {
    productRepo = new InMemoryProductRepository()
    movementRepo = new InMemoryStockMovementRepository()
    receiptRepo = new InMemoryReceiptRepository()
    useCase = new ProcessSaleUseCase(productRepo, movementRepo, receiptRepo)

    productA = new Product({
      id: 'prod-pos-1',
      name: 'Pintura Látex Interior 4L',
      price: 18000,
      cost: 9500,
      stock: 6,
      barcode: '7791112220001',
    })

    productB = new Product({
      id: 'prod-pos-2',
      name: 'Pincel N° 20',
      price: 2500,
      cost: 1100,
      stock: 15,
      barcode: '7791112220002',
    })

    await productRepo.save(productA)
    await productRepo.save(productB)
  })

  it('should process sale, deduct stock, create receipt and record OUT movements', async () => {
    const saleResult = await useCase.execute({
      customerName: 'Gómez Construcciones',
      items: [
        { productId: 'prod-pos-1', quantity: 2 }, // 2 * 18000 = 36000
        { productId: 'prod-pos-2', quantity: 3 }, // 3 * 2500 = 7500
      ],
      paymentMethod: 'EFECTIVO',
      amountPaid: 50000,
    })

    // Total: 36000 + 7500 = 43500
    expect(saleResult.receipt).toBeDefined()
    expect(saleResult.receipt.totalAmount).toBe(43500)
    expect(saleResult.receipt.customerName).toBe('Gómez Construcciones')
    expect(saleResult.receipt.items).toHaveLength(2)
    expect(saleResult.change).toBe(6500) // 50000 - 43500

    // Verificar deducción de stock en el repositorio
    const updatedA = await productRepo.findById('prod-pos-1')
    expect(updatedA?.stock).toBe(4) // 6 - 2

    const updatedB = await productRepo.findById('prod-pos-2')
    expect(updatedB?.stock).toBe(12) // 15 - 3

    // Verificar persistencia del comprobante
    const savedReceipt = await receiptRepo.findById(saleResult.receipt.id)
    expect(savedReceipt).not.toBeNull()
    expect(savedReceipt?.totalAmount).toBe(43500)

    // Verificar movimientos OUT de auditoría
    const movementsA = await movementRepo.findByProductId('prod-pos-1')
    expect(movementsA).toHaveLength(1)
    expect(movementsA[0].type).toBe('OUT')
    expect(movementsA[0].quantity).toBe(2)

    const movementsB = await movementRepo.findByProductId('prod-pos-2')
    expect(movementsB).toHaveLength(1)
    expect(movementsB[0].type).toBe('OUT')
    expect(movementsB[0].quantity).toBe(3)
  })

  it('should abort and not deduct any stock if any product has insufficient stock', async () => {
    await expect(
      useCase.execute({
        items: [
          { productId: 'prod-pos-1', quantity: 1 }, // Stock es 6 (OK)
          { productId: 'prod-pos-2', quantity: 20 }, // Stock es 15 (INSUFICIENTE)
        ],
      })
    ).rejects.toThrow(InsufficientStockError)

    // Verificar que NINGÚN producto fue modificado (atomicidad)
    const currentA = await productRepo.findById('prod-pos-1')
    expect(currentA?.stock).toBe(6)

    const currentB = await productRepo.findById('prod-pos-2')
    expect(currentB?.stock).toBe(15)

    // Ningún movimiento ni comprobante guardado
    const allReceipts = await receiptRepo.findAll()
    expect(allReceipts).toHaveLength(0)
  })

  it('should throw ValidationError if cart is empty', async () => {
    await expect(
      useCase.execute({
        items: [],
      })
    ).rejects.toThrow(ValidationError)
  })
})
