import { ValidationError } from '../errors'

export type MovementType = 'IN' | 'OUT' | 'MANUAL'

export interface StockMovementProps {
  id: string
  productId: string
  supplierId?: string
  type: MovementType
  quantity: number
  reason?: string
  date?: Date
  createdAt?: Date
}

export class StockMovement {
  readonly id: string
  readonly productId: string
  readonly supplierId?: string
  readonly type: MovementType
  readonly quantity: number
  readonly reason?: string
  readonly date: Date
  readonly createdAt: Date

  constructor(props: StockMovementProps) {
    this.validate(props)

    this.id = props.id
    this.productId = props.productId.trim()
    this.supplierId = props.supplierId?.trim() || undefined
    this.type = props.type
    this.quantity = props.quantity
    this.reason = props.reason?.trim() || undefined
    this.date = props.date ?? new Date()
    this.createdAt = props.createdAt ?? new Date()
  }

  private validate(props: StockMovementProps): void {
    if (!props.id || typeof props.id !== 'string') {
      throw new ValidationError('El id del movimiento es obligatorio')
    }
    if (!props.productId || props.productId.trim().length === 0) {
      throw new ValidationError('El id del producto es obligatorio')
    }
    const validTypes: MovementType[] = ['IN', 'OUT', 'MANUAL']
    if (!validTypes.includes(props.type)) {
      throw new ValidationError(`Tipo de movimiento inválido: ${props.type}. Debe ser IN, OUT o MANUAL`)
    }
    if (props.quantity <= 0 || !Number.isInteger(props.quantity)) {
      throw new ValidationError('La cantidad del movimiento debe ser un número entero mayor a 0')
    }
  }
}
