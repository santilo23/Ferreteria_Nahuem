import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VoidSaleUseCase } from './void-sale'
import { IReceiptRepository, IProductRepository, IStockMovementRepository } from '../domain/repositories'
import { Product, Receipt, ReceiptItem, StockMovement } from '../domain/entities'
import { EntityNotFoundError, ValidationError } from '../domain/errors'

describe('VoidSaleUseCase', () => {
  let receiptRepository: IReceiptRepository
  let productRepository: IProductRepository
  let stockMovementRepository: IStockMovementRepository
  let useCase: VoidSaleUseCase

  let mockProduct: Product
  let mockReceipt: Receipt

  beforeEach(() => {
    mockProduct = new Product({
      id: 'prod-123',
      name: 'Disco de Desbaste 115mm',
      price: 2500,
      cost: 1200,
      stock: 8, // Stock actual
    })

    const mockItem = new ReceiptItem({
      id: 'item-1',
      receiptId: 'rec-123',
      productId: 'prod-123',
      quantity: 3,
      unitPrice: 2500,
    })

    mockReceipt = new Receipt({
      id: 'rec-123',
      customerName: 'Carlos Gómez',
      items: [mockItem],
      date: new Date(),
    })

    receiptRepository = {
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(mockReceipt),
      findAll: vi.fn(),
    }

    productRepository = {
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      search: vi.fn(),
      findById: vi.fn().mockResolvedValue(mockProduct),
      findByBarcode: vi.fn(),
      findAll: vi.fn(),
    }

    stockMovementRepository = {
      save: vi.fn(),
      findByProductId: vi.fn(),
      findAll: vi.fn(),
    }

    useCase = new VoidSaleUseCase(
      receiptRepository,
      productRepository,
      stockMovementRepository
    )
  })

  it('should throw EntityNotFoundError if receipt does not exist', async () => {
    vi.mocked(receiptRepository.findById).mockResolvedValueOnce(null)

    await expect(
      useCase.execute({ receiptId: 'non-existent' })
    ).rejects.toThrow(EntityNotFoundError)
  })

  it('should throw ValidationError if receipt is already cancelled', async () => {
    mockReceipt.cancel('Ya cancelado previamente')

    await expect(
      useCase.execute({ receiptId: 'rec-123' })
    ).rejects.toThrow(ValidationError)
  })

  it('should cancel the receipt, restitute stock to products, and create IN audit movements', async () => {
    const result = await useCase.execute({
      receiptId: 'rec-123',
      reason: 'Cliente devolvió el producto por rotura',
    })

    // 1. Receipt status is cancelled
    expect(result.receipt.status).toBe('CANCELLED')
    expect(result.receipt.cancelReason).toBe('Cliente devolvió el producto por rotura')
    expect(receiptRepository.save).toHaveBeenCalledWith(result.receipt)

    // 2. Product stock is restored: 8 + 3 = 11
    expect(mockProduct.stock).toBe(11)
    expect(productRepository.update).toHaveBeenCalledWith(mockProduct)

    // 3. Movement 'IN' is created for restitution
    expect(stockMovementRepository.save).toHaveBeenCalledTimes(1)
    const createdMovement = vi.mocked(stockMovementRepository.save).mock.calls[0][0] as StockMovement
    expect(createdMovement.type).toBe('IN')
    expect(createdMovement.quantity).toBe(3)
    expect(createdMovement.productId).toBe('prod-123')
    expect(createdMovement.reason).toContain('Anulación Venta')
  })
})
