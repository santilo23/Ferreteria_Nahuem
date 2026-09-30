import { Supplier } from '../entities/supplier'

export interface ISupplierRepository {
  findById(id: string): Promise<Supplier | null>
  findAll(): Promise<Supplier[]>
  save(supplier: Supplier): Promise<void>
  update(supplier: Supplier): Promise<void>
  delete(id: string): Promise<void>
}
