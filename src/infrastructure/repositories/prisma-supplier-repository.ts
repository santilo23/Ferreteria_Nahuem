import { PrismaClient } from '@prisma/client'
import { ISupplierRepository } from '@/core/domain/repositories'
import { Supplier } from '@/core/domain/entities'

export class PrismaSupplierRepository implements ISupplierRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Supplier | null> {
    const raw = await this.prisma.supplier.findUnique({
      where: { id },
    })
    if (!raw) return null
    return this.toDomain(raw)
  }

  async findAll(): Promise<Supplier[]> {
    const rawList = await this.prisma.supplier.findMany({
      orderBy: { name: 'asc' },
    })
    return rawList.map((raw) => this.toDomain(raw))
  }

  async save(supplier: Supplier): Promise<void> {
    await this.prisma.supplier.create({
      data: {
        id: supplier.id,
        name: supplier.name,
        contact: supplier.contact,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        createdAt: supplier.createdAt,
        updatedAt: supplier.updatedAt,
      },
    })
  }

  async update(supplier: Supplier): Promise<void> {
    await this.prisma.supplier.update({
      where: { id: supplier.id },
      data: {
        name: supplier.name,
        contact: supplier.contact,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        updatedAt: supplier.updatedAt,
      },
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.supplier.delete({
      where: { id },
    })
  }

  private toDomain(raw: {
    id: string
    name: string
    contact: string | null
    phone: string | null
    email: string | null
    address: string | null
    createdAt: Date
    updatedAt: Date
  }): Supplier {
    return new Supplier({
      id: raw.id,
      name: raw.name,
      contact: raw.contact ?? undefined,
      phone: raw.phone ?? undefined,
      email: raw.email ?? undefined,
      address: raw.address ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    })
  }
}
