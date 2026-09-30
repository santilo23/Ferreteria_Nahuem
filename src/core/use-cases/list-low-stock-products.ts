import { IProductRepository } from '../domain/repositories'
import { Product } from '../domain/entities'

export interface ListLowStockProductsParams {
  threshold?: number
}

export class ListLowStockProductsUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(params?: ListLowStockProductsParams): Promise<Product[]> {
    const threshold = params?.threshold ?? 5
    const allProducts = await this.productRepository.findAll()

    return allProducts
      .filter((product) => product.stock <= threshold)
      .sort((a, b) => a.stock - b.stock)
  }
}
