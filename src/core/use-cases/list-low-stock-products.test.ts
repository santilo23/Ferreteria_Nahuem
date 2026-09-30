import { describe, it, expect, beforeEach } from 'vitest'
import { ListLowStockProductsUseCase } from './list-low-stock-products'
import { InMemoryProductRepository } from '@/test/in-memory-repositories'
import { Product } from '../domain/entities'

describe('ListLowStockProductsUseCase', () => {
  let productRepo: InMemoryProductRepository
  let useCase: ListLowStockProductsUseCase

  beforeEach(async () => {
    productRepo = new InMemoryProductRepository()
    useCase = new ListLowStockProductsUseCase(productRepo)

    await productRepo.save(new Product({
      id: 'prod-low-1',
      name: 'Pintura Sintética Blanca 1L',
      price: 9000,
      cost: 5000,
      stock: 2, // Stock bajo
    }))

    await productRepo.save(new Product({
      id: 'prod-low-2',
      name: 'Aguarrás Mineral 1L',
      price: 3200,
      cost: 1600,
      stock: 0, // Sin stock
    }))

    await productRepo.save(new Product({
      id: 'prod-normal',
      name: 'Rodillo Pelo Corto',
      price: 4500,
      cost: 2200,
      stock: 25, // Stock holgado
    }))
  })

  it('should list products with stock at or below default threshold (5)', async () => {
    const lowStockList = await useCase.execute()

    expect(lowStockList).toHaveLength(2)
    const ids = lowStockList.map((p) => p.id)
    expect(ids).toContain('prod-low-1')
    expect(ids).toContain('prod-low-2')
    expect(ids).not.toContain('prod-normal')
  })

  it('should allow custom threshold', async () => {
    const lowStockList = await useCase.execute({ threshold: 1 })

    expect(lowStockList).toHaveLength(1)
    expect(lowStockList[0].id).toBe('prod-low-2')
  })
})
