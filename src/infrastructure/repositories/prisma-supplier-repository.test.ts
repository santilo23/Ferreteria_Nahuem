import { describe, it, expect, beforeEach } from 'vitest'
import prisma from '../database/prisma'
import { PrismaSupplierRepository } from './prisma-supplier-repository'
import { Supplier } from '@/core/domain/entities'

describe('PrismaSupplierRepository Integration', () => {
  const repository = new PrismaSupplierRepository(prisma)

  beforeEach(async () => {
    await prisma.stockMovement.deleteMany()
    await prisma.supplier.deleteMany()
  })

  it('should save and find a supplier by id', async () => {
    const supplier = new Supplier({
      id: 'sup-test-1',
      name: 'Ferretería Industrial Sur',
      contact: 'Carlos Gómez',
      phone: '11-2233-4455',
      email: 'contacto@sur.com',
      address: 'Ruta 3 Km 35',
    })

    await repository.save(supplier)

    const found = await repository.findById('sup-test-1')
    expect(found).not.toBeNull()
    expect(found?.name).toBe('Ferretería Industrial Sur')
    expect(found?.email).toBe('contacto@sur.com')
  })

  it('should list all suppliers', async () => {
    await repository.save(new Supplier({
      id: 'sup-list-1',
      name: 'Proveedor A',
    }))
    await repository.save(new Supplier({
      id: 'sup-list-2',
      name: 'Proveedor B',
    }))

    const list = await repository.findAll()
    expect(list.length).toBeGreaterThanOrEqual(2)
  })

  it('should delete a supplier by id', async () => {
    const supplier = new Supplier({
      id: 'sup-del-1',
      name: 'Proveedor Para Borrar',
    })

    await repository.save(supplier)
    await repository.delete('sup-del-1')

    const found = await repository.findById('sup-del-1')
    expect(found).toBeNull()
  })
})
