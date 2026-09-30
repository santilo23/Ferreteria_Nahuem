import { PrismaClient } from '@prisma/client'
import { IReceiptRepository } from '@/core/domain/repositories'
import { Receipt, ReceiptItem } from '@/core/domain/entities'

export class PrismaReceiptRepository implements IReceiptRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(receipt: Receipt): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.receipt.create({
        data: {
          id: receipt.id,
          customerName: receipt.customerName,
          totalAmount: receipt.totalAmount,
          date: receipt.date,
          createdAt: receipt.createdAt,
        },
      })

      if (receipt.items.length > 0) {
        await tx.receiptItem.createMany({
          data: receipt.items.map((item) => ({
            id: item.id,
            receiptId: receipt.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          })),
        })
      }
    })
  }

  async findById(id: string): Promise<Receipt | null> {
    const raw = await this.prisma.receipt.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!raw) return null
    return this.toDomain(raw)
  }

  async findAll(): Promise<Receipt[]> {
    const rawList = await this.prisma.receipt.findMany({
      include: { items: true },
      orderBy: { date: 'desc' },
    })
    return rawList.map((raw) => this.toDomain(raw))
  }

  private toDomain(raw: {
    id: string
    customerName: string | null
    totalAmount: number
    date: Date
    createdAt: Date
    items: Array<{
      id: string
      receiptId: string
      productId: string
      quantity: number
      unitPrice: number
      subtotal: number
    }>
  }): Receipt {
    const items = raw.items.map(
      (item) =>
        new ReceiptItem({
          id: item.id,
          receiptId: item.receiptId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })
    )

    return new Receipt({
      id: raw.id,
      customerName: raw.customerName ?? undefined,
      items,
      date: raw.date,
      createdAt: raw.createdAt,
    })
  }
}
