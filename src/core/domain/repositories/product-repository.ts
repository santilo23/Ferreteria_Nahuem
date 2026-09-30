import { Product } from '../entities/product'

export interface IProductRepository {
  findById(id: string): Promise<Product | null>
  findByBarcode(barcode: string): Promise<Product | null>
  search(query: string): Promise<Product[]>
  findAll(): Promise<Product[]>
  save(product: Product): Promise<void>
  update(product: Product): Promise<void>
  delete(id: string): Promise<void>
}
