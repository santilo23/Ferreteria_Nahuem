import { PrismaClient } from '@prisma/client'
import { IProductRepository } from '@/core/domain/repositories'
import { Product } from '@/core/domain/entities'

export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Product | null> {
    const raw = await this.prisma.product.findUnique({
      where: { id },
    })
    if (!raw) return null
    return this.toDomain(raw)
  }

  async findByBarcode(barcode: string): Promise<Product | null> {
    const raw = await this.prisma.product.findUnique({
      where: { barcode },
    })
    if (!raw) return null
    return this.toDomain(raw)
  }

  async search(query: string): Promise<Product[]> {
    const rawList = await this.prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
          { barcode: { contains: query } },
        ],
      },
      orderBy: { name: 'asc' },
    })
    return rawList.map((raw) => this.toDomain(raw))
  }

  async findAll(): Promise<Product[]> {
    const rawList = await this.prisma.product.findMany({
      orderBy: { name: 'asc' },
    })
    return rawList.map((raw) => this.toDomain(raw))
  }

  async save(product: Product): Promise<void> {
    await this.prisma.product.create({
      data: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        cost: product.cost,
        stock: product.stock,
        barcode: product.barcode,
        categoryId: product.categoryId,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
    })
  }

  async update(product: Product): Promise<void> {
    await this.prisma.product.update({
      where: { id: product.id },
      data: {
        name: product.name,
        description: product.description,
        price: product.price,
        cost: product.cost,
        stock: product.stock,
        barcode: product.barcode,
        categoryId: product.categoryId,
        updatedAt: product.updatedAt,
      },
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({
      where: { id },
    })
  }

  private toDomain(raw: {
    id: string
    name: string
    description: string | null
    price: number
    cost: number
    stock: number
    barcode: string | null
    categoryId: string | null
    createdAt: Date
    updatedAt: Date
  }): Product {
    return new Product({
      id: raw.id,
      name: raw.name,
      description: raw.description ?? undefined,
      price: raw.price,
      cost: raw.cost,
      stock: raw.stock,
      barcode: raw.barcode ?? undefined,
      categoryId: raw.categoryId ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    })
  }
}
