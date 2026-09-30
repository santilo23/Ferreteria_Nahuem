import { PrismaClient } from '@prisma/client'
import { IStockMovementRepository } from '@/core/domain/repositories'
import { StockMovement, MovementType } from '@/core/domain/entities'

export class PrismaStockMovementRepository implements IStockMovementRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(movement: StockMovement): Promise<void> {
    await this.prisma.stockMovement.create({
      data: {
        id: movement.id,
        productId: movement.productId,
        supplierId: movement.supplierId,
        type: movement.type,
        quantity: movement.quantity,
        reason: movement.reason,
        date: movement.date,
        createdAt: movement.createdAt,
      },
    })
  }

  async findByProductId(productId: string): Promise<StockMovement[]> {
    const rawList = await this.prisma.stockMovement.findMany({
      where: { productId },
      orderBy: { date: 'desc' },
    })
    return rawList.map((raw) => this.toDomain(raw))
  }

  async findAll(): Promise<StockMovement[]> {
    const rawList = await this.prisma.stockMovement.findMany({
      orderBy: { date: 'desc' },
    })
    return rawList.map((raw) => this.toDomain(raw))
  }

  private toDomain(raw: {
    id: string
    productId: string
    supplierId: string | null
    type: string
    quantity: number
    reason: string | null
    date: Date
    createdAt: Date
  }): StockMovement {
    return new StockMovement({
      id: raw.id,
      productId: raw.productId,
      supplierId: raw.supplierId ?? undefined,
      type: raw.type as MovementType,
      quantity: raw.quantity,
      reason: raw.reason ?? undefined,
      date: raw.date,
      createdAt: raw.createdAt,
    })
  }
}
