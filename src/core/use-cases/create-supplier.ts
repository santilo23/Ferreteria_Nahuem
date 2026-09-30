import { ISupplierRepository } from '../domain/repositories'
import { Supplier } from '../domain/entities'

export interface CreateSupplierDTO {
  name: string
  contact?: string
  phone?: string
  email?: string
  address?: string
}

export class CreateSupplierUseCase {
  constructor(private readonly supplierRepository: ISupplierRepository) {}

  async execute(dto: CreateSupplierDTO): Promise<Supplier> {
    const supplier = new Supplier({
      id: crypto.randomUUID(),
      name: dto.name,
      contact: dto.contact,
      phone: dto.phone,
      email: dto.email,
      address: dto.address,
    })

    await this.supplierRepository.save(supplier)
    return supplier
  }
}
