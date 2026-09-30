import { describe, it, expect, beforeEach } from 'vitest'
import prisma from '../database/prisma'
import { PrismaProductRepository } from './prisma-product-repository'
import { Product } from '@/core/domain/entities'

describe('PrismaProductRepository Integration', () => {
  const repository = new PrismaProductRepository(prisma)

  beforeEach(async () => {
    await prisma.receiptItem.deleteMany()
    await prisma.stockMovement.deleteMany()
    await prisma.product.deleteMany()
  })

  it('should save and find a product by id', async () => {
    const product = new Product({
      id: 'prod-test-1',
      name: 'Martillo Galponero 16oz',
      description: 'Mango de fibra',
      price: 12500,
      cost: 7000,
      stock: 8,
      barcode: '7790001112223',
    })

    await repository.save(product)

    const found = await repository.findById('prod-test-1')
    expect(found).not.toBeNull()
    expect(found?.id).toBe('prod-test-1')
    expect(found?.name).toBe('Martillo Galponero 16oz')
    expect(found?.price).toBe(12500)
    expect(found?.cost).toBe(7000)
    expect(found?.stock).toBe(8)
    expect(found?.barcode).toBe('7790001112223')
  })

  it('should find a product by barcode', async () => {
    const product = new Product({
      id: 'prod-test-2',
      name: 'Cinta Métrica 5m',
      price: 3500,
      cost: 1800,
      stock: 12,
      barcode: '7799998887776',
    })

    await repository.save(product)

    const found = await repository.findByBarcode('7799998887776')
    expect(found).not.toBeNull()
    expect(found?.name).toBe('Cinta Métrica 5m')
  })

  it('should search products by text query in name', async () => {
    await repository.save(new Product({
      id: 'prod-search-1',
      name: 'Tornillo Autoperforante 1"',
      price: 20,
      cost: 10,
      stock: 500,
    }))

    await repository.save(new Product({
      id: 'prod-search-2',
      name: 'Tornillo Madera 2"',
      price: 30,
      cost: 15,
      stock: 300,
    }))

    await repository.save(new Product({
      id: 'prod-search-3',
      name: 'Destornillador Phillips',
      price: 4500,
      cost: 2500,
      stock: 10,
    }))

    const results = await repository.search('Tornillo')
    expect(results).toHaveLength(2)
  })

  it('should update an existing product', async () => {
    const product = new Product({
      id: 'prod-update-1',
      name: 'Pincel 2 pulgadas',
      price: 1800,
      cost: 900,
      stock: 15,
    })

    await repository.save(product)

    product.increaseStock(10)
    await repository.update(product)

    const updated = await repository.findById('prod-update-1')
    expect(updated?.stock).toBe(25)
  })

  it('should delete a product by id', async () => {
    const product = new Product({
      id: 'prod-del-1',
      name: 'Lija al agua 180',
      price: 300,
      cost: 150,
      stock: 100,
    })

    await repository.save(product)
    await repository.delete('prod-del-1')

    const found = await repository.findById('prod-del-1')
    expect(found).toBeNull()
  })
})
