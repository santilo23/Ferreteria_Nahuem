import { IProductRepository, IStockMovementRepository } from '../domain/repositories'
import { Product, StockMovement, MovementType } from '../domain/entities'
import { EntityNotFoundError, ValidationError } from '../domain/errors'

export interface UpdateStockDTO {
  productId: string
  type: MovementType
  quantity: number
  supplierId?: string
  reason?: string
  manualDirection?: 'ADD' | 'SUBTRACT' | 'SET'
}

export class UpdateStockUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly stockMovementRepository: IStockMovementRepository
  ) {}

  async execute(dto: UpdateStockDTO): Promise<Product> {
    if (dto.quantity <= 0 || !Number.isInteger(dto.quantity)) {
      throw new ValidationError('La cantidad del movimiento debe ser un número entero mayor a 0')
    }

    const product = await this.productRepository.findById(dto.productId)
    if (!product) {
      throw new EntityNotFoundError('Producto', dto.productId)
    }

    if (dto.type === 'IN') {
      product.increaseStock(dto.quantity)
    } else if (dto.type === 'OUT') {
      product.decreaseStock(dto.quantity)
    } else if (dto.type === 'MANUAL') {
      if (dto.manualDirection === 'SUBTRACT') {
        product.decreaseStock(dto.quantity)
      } else if (dto.manualDirection === 'SET') {
        const diff = dto.quantity - product.stock
        if (diff > 0) {
          product.increaseStock(diff)
        } else if (diff < 0) {
          product.decreaseStock(Math.abs(diff))
        }
      } else {
        product.increaseStock(dto.quantity)
      }
    }

    const movement = new StockMovement({
      id: crypto.randomUUID(),
      productId: product.id,
      supplierId: dto.supplierId,
      type: dto.type,
      quantity: dto.quantity,
      reason: dto.reason,
      date: new Date(),
    })

    await this.stockMovementRepository.save(movement)
    await this.productRepository.update(product)

    return product
  }
}
