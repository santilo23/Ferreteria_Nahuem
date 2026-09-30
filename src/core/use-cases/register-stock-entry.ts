import { IProductRepository, IStockMovementRepository, ISupplierRepository } from '../domain/repositories'
import { Product, StockMovement } from '../domain/entities'
import { EntityNotFoundError, ValidationError } from '../domain/errors'

export interface RegisterStockEntryDTO {
  productId: string
  quantity: number
  supplierId?: string
  cost?: number
  reason?: string
  date?: Date
}

export class RegisterStockEntryUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly stockMovementRepository: IStockMovementRepository,
    private readonly supplierRepository?: ISupplierRepository
  ) {}

  async execute(dto: RegisterStockEntryDTO): Promise<Product> {
    if (dto.quantity <= 0 || !Number.isInteger(dto.quantity)) {
      throw new ValidationError('La cantidad recibida debe ser un número entero mayor a 0')
    }

    if (dto.cost !== undefined && dto.cost < 0) {
      throw new ValidationError('El costo de compra no puede ser negativo')
    }

    const product = await this.productRepository.findById(dto.productId)
    if (!product) {
      throw new EntityNotFoundError('Producto', dto.productId)
    }

    if (dto.supplierId && this.supplierRepository) {
      const supplier = await this.supplierRepository.findById(dto.supplierId)
      if (!supplier) {
        throw new EntityNotFoundError('Proveedor', dto.supplierId)
      }
    }

    product.increaseStock(dto.quantity)

    if (dto.cost !== undefined) {
      product.updateCost(dto.cost)
    }

    const movement = new StockMovement({
      id: crypto.randomUUID(),
      productId: product.id,
      supplierId: dto.supplierId,
      type: 'IN',
      quantity: dto.quantity,
      reason: dto.reason,
      date: dto.date ?? new Date(),
    })

    await this.stockMovementRepository.save(movement)
    await this.productRepository.update(product)

    return product
  }
}
