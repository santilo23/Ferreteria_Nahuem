import { Product } from '../entities'
import { InsufficientStockError, ValidationError } from '../errors'

export interface CartItem {
  productId: string
  productName: string
  unitPrice: number
  quantity: number
  subtotal: number
  maxStock: number
}

export class PosCart {
  private _items: Map<string, CartItem> = new Map()

  get items(): CartItem[] {
    return Array.from(this._items.values())
  }

  get total(): number {
    return this.items.reduce((sum, item) => sum + item.subtotal, 0)
  }

  addItem(product: Product, quantity = 1): void {
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      throw new ValidationError('La cantidad a agregar debe ser un número entero mayor a 0')
    }

    if (product.stock <= 0) {
      throw new ValidationError(`El producto "${product.name}" no tiene existencias disponibles`)
    }

    const existing = this._items.get(product.id)
    const currentQty = existing ? existing.quantity : 0
    const newQty = currentQty + quantity

    if (newQty > product.stock) {
      throw new InsufficientStockError(
        `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, en carrito: ${currentQty}, solicitado: ${quantity}`
      )
    }

    this._items.set(product.id, {
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      quantity: newQty,
      subtotal: newQty * product.price,
      maxStock: product.stock,
    })
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity < 0 || !Number.isInteger(quantity)) {
      throw new ValidationError('La cantidad debe ser un número entero mayor o igual a 0')
    }

    const item = this._items.get(productId)
    if (!item) return

    if (quantity === 0) {
      this._items.delete(productId)
      return
    }

    if (quantity > item.maxStock) {
      throw new InsufficientStockError(
        `Stock insuficiente para "${item.productName}". Disponible: ${item.maxStock}, solicitado: ${quantity}`
      )
    }

    this._items.set(productId, {
      ...item,
      quantity,
      subtotal: quantity * item.unitPrice,
    })
  }

  removeItem(productId: string): void {
    this._items.delete(productId)
  }

  clear(): void {
    this._items.clear()
  }
}
