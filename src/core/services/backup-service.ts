import { Product, Supplier, StockMovement, Receipt, ReceiptItem } from '../domain/entities'
import { ValidationError } from '../domain/errors'

export interface BackupPayload {
  products: Product[]
  suppliers: Supplier[]
  movements: StockMovement[]
  receipts: Receipt[]
}

export interface SerializedBackup {
  version: string
  exportDate: string
  products: Array<{
    id: string
    name: string
    description?: string
    price: number
    cost: number
    stock: number
    barcode?: string
    categoryId?: string
    createdAt?: string
    updatedAt?: string
  }>
  suppliers: Array<{
    id: string
    name: string
    contact?: string
    phone?: string
    email?: string
    address?: string
    createdAt?: string
  }>
  movements: Array<{
    id: string
    productId: string
    supplierId?: string
    type: string
    quantity: number
    reason?: string
    date: string
  }>
  receipts: Array<{
    id: string
    customerName?: string
    totalAmount: number
    status?: string
    cancelReason?: string
    cancelledAt?: string
    date: string
    items: Array<{
      id: string
      receiptId: string
      productId: string
      quantity: number
      unitPrice: number
      subtotal: number
    }>
  }>
}

export class BackupService {
  /**
   * Export all system entities to a formatted JSON backup string.
   */
  static exportToJson(data: BackupPayload): string {
    const payload: SerializedBackup = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      products: data.products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        cost: p.cost,
        stock: p.stock,
        barcode: p.barcode,
        categoryId: p.categoryId,
        createdAt: p.createdAt?.toISOString(),
        updatedAt: p.updatedAt?.toISOString(),
      })),
      suppliers: data.suppliers.map((s) => ({
        id: s.id,
        name: s.name,
        contact: s.contact,
        phone: s.phone,
        email: s.email,
        address: s.address,
        createdAt: s.createdAt?.toISOString(),
      })),
      movements: data.movements.map((m) => ({
        id: m.id,
        productId: m.productId,
        supplierId: m.supplierId,
        type: m.type,
        quantity: m.quantity,
        reason: m.reason,
        date: m.date?.toISOString(),
      })),
      receipts: data.receipts.map((r) => ({
        id: r.id,
        customerName: r.customerName,
        totalAmount: r.totalAmount,
        status: r.status,
        cancelReason: r.cancelReason,
        cancelledAt: r.cancelledAt?.toISOString(),
        date: r.date?.toISOString(),
        items: r.items.map((i) => ({
          id: i.id,
          receiptId: i.receiptId,
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          subtotal: i.subtotal,
        })),
      })),
    }

    return JSON.stringify(payload, null, 2)
  }

  /**
   * Parse and validate a JSON backup string, returning domain entities.
   */
  static importFromJson(jsonString: string): BackupPayload {
    let parsed: any
    try {
      parsed = JSON.parse(jsonString)
    } catch {
      throw new ValidationError('El archivo no contiene un JSON válido')
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new ValidationError('El formato del archivo de respaldo es inválido')
    }

    if (!Array.isArray(parsed.products)) {
      throw new ValidationError('El archivo no contiene la lista de productos requerida')
    }

    const products = parsed.products.map(
      (p: any) =>
        new Product({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          cost: p.cost,
          stock: p.stock,
          barcode: p.barcode,
          categoryId: p.categoryId,
          createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
          updatedAt: p.updatedAt ? new Date(p.updatedAt) : undefined,
        })
    )

    const suppliers = Array.isArray(parsed.suppliers)
      ? parsed.suppliers.map(
          (s: any) =>
            new Supplier({
              id: s.id,
              name: s.name,
              contact: s.contact,
              phone: s.phone,
              email: s.email,
              address: s.address,
              createdAt: s.createdAt ? new Date(s.createdAt) : undefined,
            })
        )
      : []

    const movements = Array.isArray(parsed.movements)
      ? parsed.movements.map(
          (m: any) =>
            new StockMovement({
              id: m.id,
              productId: m.productId,
              supplierId: m.supplierId,
              type: m.type as any,
              quantity: m.quantity,
              reason: m.reason,
              date: m.date ? new Date(m.date) : new Date(),
            })
        )
      : []

    const receipts = Array.isArray(parsed.receipts)
      ? parsed.receipts.map((r: any) => {
          const items = Array.isArray(r.items)
            ? r.items.map(
                (i: any) =>
                  new ReceiptItem({
                    id: i.id,
                    receiptId: i.receiptId,
                    productId: i.productId,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
                  })
              )
            : []

          return new Receipt({
            id: r.id,
            customerName: r.customerName,
            items,
            date: r.date ? new Date(r.date) : new Date(),
            status: r.status,
            cancelReason: r.cancelReason,
            cancelledAt: r.cancelledAt ? new Date(r.cancelledAt) : undefined,
          })
        })
      : []

    return {
      products,
      suppliers,
      movements,
      receipts,
    }
  }

  /**
   * Generate an Excel-friendly CSV with UTF-8 BOM for products.
   */
  static exportProductsToCsv(products: Product[]): string {
    const BOM = '\uFEFF'
    const headers = ['Código de Barras', 'Nombre', 'Descripción', 'Precio Venta', 'Costo', 'Stock']
    const rows = products.map((p) => [
      p.barcode ? `"${p.barcode}"` : '""',
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.description || '').replace(/"/g, '""')}"`,
      p.price.toString(),
      p.cost.toString(),
      p.stock.toString(),
    ])

    return BOM + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')
  }

  /**
   * Generate an Excel-friendly CSV with UTF-8 BOM for sales history.
   */
  static exportSalesToCsv(receipts: Receipt[]): string {
    const BOM = '\uFEFF'
    const headers = ['Ticket', 'Fecha', 'Hora', 'Cliente', 'Total', 'Estado', 'Cant Ítems']
    const rows = receipts.map((r) => {
      const d = new Date(r.date)
      const dateStr = d.toLocaleDateString('es-AR')
      const timeStr = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      return [
        `"#${r.id.slice(0, 8).toUpperCase()}"`,
        `"${dateStr}"`,
        `"${timeStr}"`,
        `"${(r.customerName || 'Consumidor Final').replace(/"/g, '""')}"`,
        r.totalAmount.toString(),
        r.status,
        r.items.length.toString(),
      ]
    })

    return BOM + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')
  }
}
