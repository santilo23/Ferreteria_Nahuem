import { ValidationError } from '../errors'

export interface ReceiptItemProps {
  id: string
  receiptId: string
  productId: string
  quantity: number
  unitPrice: number
}

export class ReceiptItem {
  readonly id: string
  readonly receiptId: string
  readonly productId: string
  readonly quantity: number
  readonly unitPrice: number
  readonly subtotal: number

  constructor(props: ReceiptItemProps) {
    this.validate(props)

    this.id = props.id
    this.receiptId = props.receiptId
    this.productId = props.productId
    this.quantity = props.quantity
    this.unitPrice = props.unitPrice
    this.subtotal = props.quantity * props.unitPrice
  }

  private validate(props: ReceiptItemProps): void {
    if (!props.id || typeof props.id !== 'string') {
      throw new ValidationError('El id del item es obligatorio')
    }
    if (!props.receiptId || typeof props.receiptId !== 'string') {
      throw new ValidationError('El id del comprobante es obligatorio')
    }
    if (!props.productId || typeof props.productId !== 'string') {
      throw new ValidationError('El id del producto es obligatorio')
    }
    if (props.quantity <= 0 || !Number.isInteger(props.quantity)) {
      throw new ValidationError('La cantidad del item debe ser un número entero mayor a 0')
    }
    if (props.unitPrice < 0) {
      throw new ValidationError('El precio unitario no puede ser negativo')
    }
  }
}

export type ReceiptStatus = 'COMPLETED' | 'CANCELLED'

export interface ReceiptProps {
  id: string
  customerName?: string
  items: ReceiptItem[]
  date?: Date
  createdAt?: Date
  status?: ReceiptStatus
  cancelledAt?: Date
  cancelReason?: string
}

export class Receipt {
  readonly id: string
  readonly customerName?: string
  readonly items: ReceiptItem[]
  readonly totalAmount: number
  readonly date: Date
  readonly createdAt: Date

  private _status: ReceiptStatus
  private _cancelledAt?: Date
  private _cancelReason?: string

  constructor(props: ReceiptProps) {
    this.validate(props)

    this.id = props.id
    this.customerName = props.customerName?.trim() || undefined
    this.items = [...props.items]
    this.totalAmount = this.items.reduce((sum, item) => sum + item.subtotal, 0)
    this.date = props.date ?? new Date()
    this.createdAt = props.createdAt ?? new Date()

    this._status = props.status ?? 'COMPLETED'
    this._cancelledAt = props.cancelledAt
    this._cancelReason = props.cancelReason
  }

  get status(): ReceiptStatus {
    return this._status
  }

  get cancelledAt(): Date | undefined {
    return this._cancelledAt
  }

  get cancelReason(): string | undefined {
    return this._cancelReason
  }

  cancel(reason?: string): void {
    if (this._status === 'CANCELLED') {
      throw new ValidationError('El comprobante ya se encuentra anulado')
    }
    this._status = 'CANCELLED'
    this._cancelledAt = new Date()
    this._cancelReason = reason?.trim() || 'Venta anulada por el operador'
  }

  private validate(props: ReceiptProps): void {
    if (!props.id || typeof props.id !== 'string') {
      throw new ValidationError('El id del comprobante es obligatorio')
    }
    if (!props.items || props.items.length === 0) {
      throw new ValidationError('El comprobante debe tener al menos un ítem')
    }
  }
}
