export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DomainError'
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class InsufficientStockError extends DomainError {
  constructor(message: string = 'Stock insuficiente para realizar la operación') {
    super(message)
    this.name = 'InsufficientStockError'
  }
}

export class EntityNotFoundError extends DomainError {
  constructor(entityName: string, id: string) {
    super(`${entityName} con id ${id} no encontrado`)
    this.name = 'EntityNotFoundError'
  }
}
