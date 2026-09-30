import { ValidationError } from '../errors'

export interface SupplierProps {
  id: string
  name: string
  contact?: string
  phone?: string
  email?: string
  address?: string
  createdAt?: Date
  updatedAt?: Date
}

export class Supplier {
  readonly id: string
  private _name: string
  private _contact?: string
  private _phone?: string
  private _email?: string
  private _address?: string
  readonly createdAt: Date
  private _updatedAt: Date

  constructor(props: SupplierProps) {
    this.validate(props)

    this.id = props.id
    this._name = props.name.trim()
    this._contact = props.contact?.trim() || undefined
    this._phone = props.phone?.trim() || undefined
    this._email = props.email?.trim() || undefined
    this._address = props.address?.trim() || undefined
    this.createdAt = props.createdAt ?? new Date()
    this._updatedAt = props.updatedAt ?? new Date()
  }

  get name(): string {
    return this._name
  }

  get contact(): string | undefined {
    return this._contact
  }

  get phone(): string | undefined {
    return this._phone
  }

  get email(): string | undefined {
    return this._email
  }

  get address(): string | undefined {
    return this._address
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  private validate(props: SupplierProps): void {
    if (!props.id || typeof props.id !== 'string') {
      throw new ValidationError('El id del proveedor es obligatorio')
    }
    if (!props.name || props.name.trim().length === 0) {
      throw new ValidationError('El nombre del proveedor no puede estar vacío')
    }
    if (props.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(props.email.trim())) {
        throw new ValidationError('El formato del correo electrónico es inválido')
      }
    }
  }
}
