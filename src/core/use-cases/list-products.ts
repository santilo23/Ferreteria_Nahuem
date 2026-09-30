import { IProductRepository } from '../domain/repositories'
import { Product } from '../domain/entities'

export interface ListProductsParams {
  query?: string
}

export class ListProductsUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(params?: ListProductsParams): Promise<Product[]> {
    if (params?.query && params.query.trim().length > 0) {
      return this.productRepository.search(params.query.trim())
    }
    return this.productRepository.findAll()
  }
}
