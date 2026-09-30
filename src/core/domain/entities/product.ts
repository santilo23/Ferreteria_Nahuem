import { ValidationError, InsufficientStockError } from '../errors'

export interface ProductProps {
  id: string
  name: string
  description?: string
  price: number
  cost: number
  stock?: number
  barcode?: string
  categoryId?: string
  createdAt?: Date
  updatedAt?: Date
}

export class Product {
  readonly id: string
  private _name: string
  private _description?: string
  private _price: number
  private _cost: number
  private _stock: number
  private _barcode?: string
  private _categoryId?: string
  readonly createdAt: Date
  private _updatedAt: Date

  constructor(props: ProductProps) {
    this.validate(props)

    this.id = props.id
    this._name = props.name.trim()
    this._description = props.description?.trim()
    this._price = props.price
    this._cost = props.cost
    this._stock = props.stock ?? 0
    this._barcode = props.barcode?.trim() || undefined
    this._categoryId = props.categoryId
    this.createdAt = props.createdAt ?? new Date()
    this._updatedAt = props.updatedAt ?? new Date()
  }

  get name(): string {
    return this._name
  }

  get description(): string | undefined {
    return this._description
  }

  get price(): number {
    return this._price
  }

  get cost(): number {
    return this._cost
  }

  get stock(): number {
    return this._stock
  }

  get barcode(): string | undefined {
    return this._barcode
  }

  get categoryId(): string | undefined {
    return this._categoryId
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  increaseStock(quantity: number): void {
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      throw new ValidationError('La cantidad a incrementar debe ser un número entero mayor a 0')
    }
    this._stock += quantity
    this._updatedAt = new Date()
  }

  decreaseStock(quantity: number): void {
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      throw new ValidationError('La cantidad a decrementar debe ser un número entero mayor a 0')
    }
    if (this._stock - quantity < 0) {
      throw new InsufficientStockError(
        `Stock insuficiente para el producto "${this._name}". Stock actual: ${this._stock}, solicitado: ${quantity}`
      )
    }
    this._stock -= quantity
    this._updatedAt = new Date()
  }

  updateCost(newCost: number): void {
    if (newCost < 0) {
      throw new ValidationError('El costo del producto no puede ser negativo')
    }
    this._cost = newCost
    this._updatedAt = new Date()
  }

  updatePrice(newPrice: number): void {
    if (newPrice < 0) {
      throw new ValidationError('El precio del producto no puede ser negativo')
    }
    this._price = newPrice
    this._updatedAt = new Date()
  }

  private validate(props: ProductProps): void {
    if (!props.id || typeof props.id !== 'string') {
      throw new ValidationError('El id del producto es obligatorio')
    }
    if (!props.name || props.name.trim().length === 0) {
      throw new ValidationError('El nombre del producto no puede estar vacío')
    }
    if (props.price < 0) {
      throw new ValidationError('El precio del producto no puede ser negativo')
    }
    if (props.cost < 0) {
      throw new ValidationError('El costo del producto no puede ser negativo')
    }
    if (props.stock !== undefined && (props.stock < 0 || !Number.isInteger(props.stock))) {
      throw new ValidationError('El stock inicial debe ser un número entero mayor o igual a 0')
    }
  }
}
