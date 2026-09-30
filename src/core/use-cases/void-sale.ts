import { IReceiptRepository, IProductRepository, IStockMovementRepository } from '../domain/repositories'
import { Product, Receipt, StockMovement } from '../domain/entities'
import { EntityNotFoundError, ValidationError } from '../domain/errors'

export interface VoidSaleDTO {
  receiptId: string
  reason?: string
}

export interface VoidSaleResult {
  receipt: Receipt
  restoredProducts: Product[]
  movements: StockMovement[]
}

export class VoidSaleUseCase {
  constructor(
    private readonly receiptRepository: IReceiptRepository,
    private readonly productRepository: IProductRepository,
    private readonly stockMovementRepository: IStockMovementRepository
  ) {}

  async execute(dto: VoidSaleDTO): Promise<VoidSaleResult> {
    const receipt = await this.receiptRepository.findById(dto.receiptId)
    if (!receipt) {
      throw new EntityNotFoundError('Comprobante', dto.receiptId)
    }

    if (receipt.status === 'CANCELLED') {
      throw new ValidationError('El comprobante ya se encuentra anulado')
    }

    // 1. Mark receipt as cancelled
    receipt.cancel(dto.reason)
    await this.receiptRepository.save(receipt)

    // 2. Restitute stock for each item in receipt
    const restoredProducts: Product[] = []
    const movements: StockMovement[] = []

    for (const item of receipt.items) {
      const product = await this.productRepository.findById(item.productId)
      if (product) {
        product.increaseStock(item.quantity)
        await this.productRepository.update(product)
        restoredProducts.push(product)

        const movement = new StockMovement({
          id: crypto.randomUUID(),
          productId: product.id,
          type: 'IN',
          quantity: item.quantity,
          reason: `Anulación Venta Ticket #${receipt.id.slice(0, 8).toUpperCase()}${dto.reason ? `: ${dto.reason}` : ''}`,
          date: new Date(),
        })

        await this.stockMovementRepository.save(movement)
        movements.push(movement)
      }
    }

    return {
      receipt,
      restoredProducts,
      movements,
    }
  }
}
