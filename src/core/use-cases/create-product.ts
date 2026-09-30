import { IProductRepository } from '../domain/repositories'
import { Product } from '../domain/entities'
import { ValidationError } from '../domain/errors'

export interface CreateProductDTO {
  name: string
  description?: string
  price: number
  cost: number
  stock?: number
  barcode?: string
  categoryId?: string
}

export class CreateProductUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(dto: CreateProductDTO): Promise<Product> {
    if (dto.barcode && dto.barcode.trim().length > 0) {
      const existing = await this.productRepository.findByBarcode(dto.barcode.trim())
      if (existing) {
        throw new ValidationError(`Ya existe un producto con el código de barras "${dto.barcode.trim()}"`)
      }
    }

    const product = new Product({
      id: crypto.randomUUID(),
      name: dto.name,
      description: dto.description,
      price: dto.price,
      cost: dto.cost,
      stock: dto.stock ?? 0,
      barcode: dto.barcode,
      categoryId: dto.categoryId,
    })

    await this.productRepository.save(product)
    return product
  }
}
