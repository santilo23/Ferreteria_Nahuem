import { IProductRepository, IStockMovementRepository, IReceiptRepository } from '../domain/repositories'
import { Product, Receipt, ReceiptItem, StockMovement } from '../domain/entities'
import { EntityNotFoundError, InsufficientStockError, ValidationError } from '../domain/errors'
import { ReceiptFormatter } from '../services/receipt-formatter'

export interface ProcessSaleItemDTO {
  productId: string
  quantity: number
}

export interface ProcessSaleDTO {
  items: ProcessSaleItemDTO[]
  customerName?: string
  paymentMethod?: string
  amountPaid?: number
}

export interface ProcessSaleResult {
  receipt: Receipt
  updatedProducts: Product[]
  change: number
  ticketText: string
}

export class ProcessSaleUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly stockMovementRepository: IStockMovementRepository,
    private readonly receiptRepository: IReceiptRepository
  ) {}

  async execute(dto: ProcessSaleDTO): Promise<ProcessSaleResult> {
    if (!dto.items || dto.items.length === 0) {
      throw new ValidationError('El carrito de venta no puede estar vacío')
    }

    // 1. Fetch and validate all products & stocks first (Atomic check before any mutations)
    const productEntries: Array<{ product: Product; quantity: number }> = []

    for (const itemDto of dto.items) {
      if (itemDto.quantity <= 0 || !Number.isInteger(itemDto.quantity)) {
        throw new ValidationError('La cantidad de cada producto debe ser un entero positivo')
      }

      const product = await this.productRepository.findById(itemDto.productId)
      if (!product) {
        throw new EntityNotFoundError('Producto', itemDto.productId)
      }

      if (product.stock < itemDto.quantity) {
        throw new InsufficientStockError(
          `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, solicitado: ${itemDto.quantity}`
        )
      }

      productEntries.push({ product, quantity: itemDto.quantity })
    }

    // 2. Generate Receipt ID & Items
    const receiptId = crypto.randomUUID()
    const receiptItems: ReceiptItem[] = []
    const updatedProducts: Product[] = []
    const itemsDetailForTicket: Array<{ name: string; quantity: number; unitPrice: number; subtotal: number }> = []

    for (const entry of productEntries) {
      const { product, quantity } = entry

      // Deduct stock
      product.decreaseStock(quantity)
      await this.productRepository.update(product)
      updatedProducts.push(product)

      // Create ReceiptItem
      const receiptItem = new ReceiptItem({
        id: crypto.randomUUID(),
        receiptId,
        productId: product.id,
        quantity,
        unitPrice: product.price,
      })
      receiptItems.push(receiptItem)

      itemsDetailForTicket.push({
        name: product.name,
        quantity,
        unitPrice: product.price,
        subtotal: receiptItem.subtotal,
      })

      // Record 'OUT' movement
      const movement = new StockMovement({
        id: crypto.randomUUID(),
        productId: product.id,
        type: 'OUT',
        quantity,
        reason: `Venta Ticket #${receiptId.slice(0, 8).toUpperCase()}`,
        date: new Date(),
      })
      await this.stockMovementRepository.save(movement)
    }

    // 3. Create Receipt
    const receipt = new Receipt({
      id: receiptId,
      customerName: dto.customerName?.trim() || undefined,
      items: receiptItems,
      date: new Date(),
    })

    await this.receiptRepository.save(receipt)

    const change =
      dto.amountPaid !== undefined && dto.amountPaid >= receipt.totalAmount
        ? dto.amountPaid - receipt.totalAmount
        : 0

    const ticketText = ReceiptFormatter.formatThermalTicket({
      receipt,
      paymentMethod: dto.paymentMethod,
      amountPaid: dto.amountPaid,
      change,
      itemsDetail: itemsDetailForTicket,
    })

    return {
      receipt,
      updatedProducts,
      change,
      ticketText,
    }
  }
}
