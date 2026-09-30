import { ISupplierRepository } from '../domain/repositories'
import { Supplier } from '../domain/entities'

export class ListSuppliersUseCase {
  constructor(private readonly supplierRepository: ISupplierRepository) {}

  async execute(): Promise<Supplier[]> {
    return this.supplierRepository.findAll()
  }
}
