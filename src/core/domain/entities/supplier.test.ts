import { describe, it, expect } from 'vitest'
import { Supplier } from './supplier'
import { ValidationError } from '../errors'

describe('Supplier Entity', () => {
  it('should create a valid supplier with all fields', () => {
    const supplier = new Supplier({
      id: 'sup-1',
      name: 'Distribuidora San Martín',
      contact: 'Juan Pérez',
      phone: '11-4455-6677',
      email: 'ventas@sanmartin.com',
      address: 'Av. Corrientes 1234',
    })

    expect(supplier.id).toBe('sup-1')
    expect(supplier.name).toBe('Distribuidora San Martín')
    expect(supplier.contact).toBe('Juan Pérez')
    expect(supplier.phone).toBe('11-4455-6677')
    expect(supplier.email).toBe('ventas@sanmartin.com')
    expect(supplier.address).toBe('Av. Corrientes 1234')
  })

  it('should throw ValidationError if supplier name is empty or only whitespace', () => {
    expect(() => new Supplier({
      id: 'sup-2',
      name: '   ',
    })).toThrow(ValidationError)
  })

  it('should throw ValidationError if email format is invalid', () => {
    expect(() => new Supplier({
      id: 'sup-3',
      name: 'Proveedor X',
      email: 'not-an-email',
    })).toThrow(ValidationError)
  })

  it('should allow valid supplier with only name and id', () => {
    const supplier = new Supplier({
      id: 'sup-4',
      name: 'Bulonera Central',
    })

    expect(supplier.id).toBe('sup-4')
    expect(supplier.name).toBe('Bulonera Central')
    expect(supplier.email).toBeUndefined()
  })
})
