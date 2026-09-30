import { IProductRepository, IStockMovementRepository } from '../domain/repositories'
import { Product, StockMovement } from '../domain/entities'
import { EntityNotFoundError, ValidationError } from '../domain/errors'

export interface ManualStockAdjustmentDTO {
  productId: string
  mode: 'ADD' | 'SUBTRACT' | 'SET'
  quantity: number
  reason: string
}

export class ManualStockAdjustmentUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly stockMovementRepository: IStockMovementRepository
  ) {}

  async execute(dto: ManualStockAdjustmentDTO): Promise<Product> {
    if (!dto.reason || dto.reason.trim().length === 0) {
      throw new ValidationError('El motivo del ajuste manual de stock es obligatorio')
    }

    if (dto.quantity < 0 || !Number.isInteger(dto.quantity)) {
      throw new ValidationError('La cantidad del ajuste debe ser un número entero mayor o igual a 0')
    }

    const product = await this.productRepository.findById(dto.productId)
    if (!product) {
      throw new EntityNotFoundError('Producto', dto.productId)
    }

    let delta = 0
    if (dto.mode === 'ADD') {
      if (dto.quantity === 0) {
        throw new ValidationError('La cantidad a agregar debe ser mayor a 0')
      }
      product.increaseStock(dto.quantity)
      delta = dto.quantity
    } else if (dto.mode === 'SUBTRACT') {
      if (dto.quantity === 0) {
        throw new ValidationError('La cantidad a restar debe ser mayor a 0')
      }
      product.decreaseStock(dto.quantity)
      delta = dto.quantity
    } else if (dto.mode === 'SET') {
      const diff = dto.quantity - product.stock
      if (diff > 0) {
        product.increaseStock(diff)
      } else if (diff < 0) {
        product.decreaseStock(Math.abs(diff))
      }
      delta = Math.abs(diff)
    }

    const movement = new StockMovement({
      id: crypto.randomUUID(),
      productId: product.id,
      type: 'MANUAL',
      quantity: delta || dto.quantity,
      reason: dto.reason.trim(),
      date: new Date(),
    })

    await this.stockMovementRepository.save(movement)
    await this.productRepository.update(product)

    return product
  }
}
