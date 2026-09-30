import { IProductRepository, IStockMovementRepository, ISupplierRepository, IReceiptRepository } from '@/core/domain/repositories'
import { Product, StockMovement, Supplier, Receipt } from '@/core/domain/entities'

export class InMemoryProductRepository implements IProductRepository {
  public products: Product[] = []

  async findById(id: string): Promise<Product | null> {
    const found = this.products.find((p) => p.id === id)
    return found ?? null
  }

  async findByBarcode(barcode: string): Promise<Product | null> {
    const found = this.products.find((p) => p.barcode === barcode)
    return found ?? null
  }

  async search(query: string): Promise<Product[]> {
    const lower = query.toLowerCase()
    return this.products.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.description?.toLowerCase().includes(lower) ||
        p.barcode?.toLowerCase().includes(lower)
    )
  }

  async findAll(): Promise<Product[]> {
    return [...this.products]
  }

  async save(product: Product): Promise<void> {
    this.products.push(product)
  }

  async update(product: Product): Promise<void> {
    const index = this.products.findIndex((p) => p.id === product.id)
    if (index !== -1) {
      this.products[index] = product
    }
  }

  async delete(id: string): Promise<void> {
    this.products = this.products.filter((p) => p.id !== id)
  }
}

export class InMemoryStockMovementRepository implements IStockMovementRepository {
  public movements: StockMovement[] = []

  async save(movement: StockMovement): Promise<void> {
    this.movements.push(movement)
  }

  async findByProductId(productId: string): Promise<StockMovement[]> {
    return this.movements.filter((m) => m.productId === productId)
  }

  async findAll(): Promise<StockMovement[]> {
    return [...this.movements]
  }
}

export class InMemorySupplierRepository implements ISupplierRepository {
  public suppliers: Supplier[] = []

  async findById(id: string): Promise<Supplier | null> {
    return this.suppliers.find((s) => s.id === id) ?? null
  }

  async findAll(): Promise<Supplier[]> {
    return [...this.suppliers]
  }

  async save(supplier: Supplier): Promise<void> {
    this.suppliers.push(supplier)
  }

  async update(supplier: Supplier): Promise<void> {
    const index = this.suppliers.findIndex((s) => s.id === supplier.id)
    if (index !== -1) {
      this.suppliers[index] = supplier
    }
  }

  async delete(id: string): Promise<void> {
    this.suppliers = this.suppliers.filter((s) => s.id !== id)
  }
}

export class InMemoryReceiptRepository implements IReceiptRepository {
  public receipts: Receipt[] = []

  async save(receipt: Receipt): Promise<void> {
    this.receipts.push(receipt)
  }

  async findById(id: string): Promise<Receipt | null> {
    return this.receipts.find((r) => r.id === id) ?? null
  }

  async findAll(): Promise<Receipt[]> {
    return [...this.receipts]
  }
}
