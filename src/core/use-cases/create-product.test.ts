import { describe, it, expect, beforeEach } from 'vitest'
import { CreateProductUseCase } from './create-product'
import { InMemoryProductRepository } from '@/test/in-memory-repositories'
import { ValidationError } from '../domain/errors'

describe('CreateProductUseCase', () => {
  let productRepo: InMemoryProductRepository
  let useCase: CreateProductUseCase

  beforeEach(() => {
    productRepo = new InMemoryProductRepository()
    useCase = new CreateProductUseCase(productRepo)
  })

  it('should create a product with valid data and save it in repository', async () => {
    const result = await useCase.execute({
      name: 'Llave Francesa 10"',
      description: 'Acero cromo vanadio',
      price: 8500,
      cost: 4500,
      stock: 12,
      barcode: '7791112223334',
    })

    expect(result.id).toBeDefined()
    expect(result.name).toBe('Llave Francesa 10"')
    expect(result.price).toBe(8500)
    expect(result.cost).toBe(4500)
    expect(result.stock).toBe(12)
    expect(result.barcode).toBe('7791112223334')

    const saved = await productRepo.findById(result.id)
    expect(saved).not.toBeNull()
    expect(saved?.name).toBe('Llave Francesa 10"')
  })

  it('should reject creation if barcode already exists', async () => {
    await useCase.execute({
      name: 'Llave Francesa 10"',
      price: 8500,
      cost: 4500,
      stock: 5,
      barcode: '7791112223334',
    })

    await expect(
      useCase.execute({
        name: 'Llave Francesa 12"',
        price: 9500,
        cost: 5000,
        stock: 3,
        barcode: '7791112223334', // Mismo código
      })
    ).rejects.toThrow(ValidationError)
  })

  it('should reject creation with empty name', async () => {
    await expect(
      useCase.execute({
        name: '   ',
        price: 100,
        cost: 50,
      })
    ).rejects.toThrow(ValidationError)
  })
})
