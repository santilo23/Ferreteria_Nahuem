import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/presentation/components/ui/dialog'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { PlusCircle, Barcode, AlertCircle } from 'lucide-react'
import { Product } from '@/core/domain/entities'
import { CreateProductDTO } from '@/core/use-cases'

interface NewProductDialogProps {
  onCreateProduct: (dto: CreateProductDTO) => Promise<Product>
  onSuccess?: () => void
}

export function NewProductDialog({ onCreateProduct, onSuccess }: NewProductDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [cost, setCost] = useState('')
  const [stock, setStock] = useState('0')
  const [barcode, setBarcode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setName('')
    setDescription('')
    setPrice('')
    setCost('')
    setStock('0')
    setBarcode('')
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('El nombre del producto es obligatorio.')
      return
    }

    const numPrice = parseFloat(price)
    if (isNaN(numPrice) || numPrice < 0) {
      setError('El precio debe ser un número mayor o igual a 0.')
      return
    }

    const numCost = parseFloat(cost)
    if (isNaN(numCost) || numCost < 0) {
      setError('El costo debe ser un número mayor o igual a 0.')
      return
    }

    const numStock = parseInt(stock, 10)
    if (isNaN(numStock) || numStock < 0) {
      setError('El stock inicial debe ser un número entero mayor o igual a 0.')
      return
    }

    try {
      setIsSubmitting(true)
      await onCreateProduct({
        name: name.trim(),
        description: description.trim() || undefined,
        price: numPrice,
        cost: numCost,
        stock: numStock,
        barcode: barcode.trim() || undefined,
      })

      resetForm()
      setOpen(false)
      onSuccess?.()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Ocurrió un error inesperado al crear el producto.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Nuevo Producto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Producto</DialogTitle>
            <DialogDescription>
              Ingresa los datos del artículo para agregarlo al catálogo e inventario.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid gap-3 py-4">
            <div className="space-y-1">
              <label htmlFor="product-name" className="text-xs font-semibold text-slate-700">
                Nombre del Producto *
              </label>
              <Input
                id="product-name"
                placeholder="ej. Clavos de 2 pulgadas"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="product-desc" className="text-xs font-semibold text-slate-700">
                Descripción / Presentación
              </label>
              <Input
                id="product-desc"
                placeholder="ej. Caja x 1 kg"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="product-price" className="text-xs font-semibold text-slate-700">
                  Precio de Venta ($) *
                </label>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="product-cost" className="text-xs font-semibold text-slate-700">
                  Costo de Compra ($) *
                </label>
                <Input
                  id="product-cost"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="product-stock" className="text-xs font-semibold text-slate-700">
                  Stock Inicial (unidades)
                </label>
                <Input
                  id="product-stock"
                  type="number"
                  step="1"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="product-barcode" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Barcode className="h-3 w-3" />
                  Código de Barras (Opcional)
                </label>
                <Input
                  id="product-barcode"
                  placeholder="779..."
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm()
                setOpen(false)
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
