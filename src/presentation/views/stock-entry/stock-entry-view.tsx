import { useState, useMemo, useRef, useEffect } from 'react'
import { Product, Supplier, StockMovement } from '@/core/domain/entities'
import { RegisterStockEntryDTO, ManualStockAdjustmentDTO } from '@/core/use-cases'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Badge } from '@/presentation/components/ui/badge'
import {
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  Search,
  CheckCircle2,
  AlertCircle,
  Truck,
  History,
  FileText,
} from 'lucide-react'

interface StockEntryViewProps {
  products: Product[]
  suppliers: Supplier[]
  movements: StockMovement[]
  onRegisterEntry: (dto: RegisterStockEntryDTO) => Promise<Product>
  onManualAdjustment: (dto: ManualStockAdjustmentDTO) => Promise<Product>
  onRefresh?: () => void
  initialProductId?: string | null
}

export function StockEntryView({
  products,
  suppliers,
  movements,
  onRegisterEntry,
  onManualAdjustment,
  onRefresh,
  initialProductId,
}: StockEntryViewProps) {
  const [mode, setMode] = useState<'entry' | 'adjustment'>('entry')

  // Search & Selected Product
  const [productQuery, setProductQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  useEffect(() => {
    if (initialProductId) {
      const prod = products.find((p) => p.id === initialProductId)
      if (prod) {
        setSelectedProduct(prod)
        setProductQuery(prod.name)
        setNewCost(prod.cost.toString())
        setTimeout(() => quantityInputRef.current?.focus(), 50)
      }
    }
  }, [initialProductId, products])

  // Entry Form state
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('')
  const [quantity, setQuantity] = useState<string>('')
  const [newCost, setNewCost] = useState<string>('')
  const [reason, setReason] = useState<string>('')

  // Adjustment Form state
  const [adjMode, setAdjMode] = useState<'SET' | 'SUBTRACT' | 'ADD'>('SET')
  const [adjQuantity, setAdjQuantity] = useState<string>('')
  const [adjReason, setAdjReason] = useState<string>('')

  // Feedback states
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const quantityInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Autocomplete products
  const matchingProducts = useMemo(() => {
    if (!productQuery.trim()) return []
    const q = productQuery.toLowerCase()
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
      )
      .slice(0, 6)
  }, [products, productQuery])

  // When a product is selected
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product)
    setProductQuery(product.name)
    setNewCost(product.cost.toString())
    setIsDropdownOpen(false)
    setFeedback(null)

    // Automatically focus the quantity field for lightning fast keyboard entry!
    setTimeout(() => {
      quantityInputRef.current?.focus()
    }, 50)
  }

  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)

    if (!selectedProduct) {
      setFeedback({ type: 'error', message: 'Debes seleccionar un producto del buscador.' })
      return
    }

    const qty = parseInt(quantity, 10)
    if (isNaN(qty) || qty <= 0) {
      setFeedback({ type: 'error', message: 'La cantidad debe ser un número entero mayor a 0.' })
      return
    }

    const costVal = newCost ? parseFloat(newCost) : undefined
    if (costVal !== undefined && (isNaN(costVal) || costVal < 0)) {
      setFeedback({ type: 'error', message: 'El costo no puede ser negativo.' })
      return
    }

    try {
      setIsSubmitting(true)
      await onRegisterEntry({
        productId: selectedProduct.id,
        quantity: qty,
        supplierId: selectedSupplierId || undefined,
        cost: costVal,
        reason: reason.trim() || undefined,
      })

      setFeedback({
        type: 'success',
        message: `¡Ingreso registrado! Se sumaron ${qty} unidades a "${selectedProduct.name}".`,
      })

      // Reset form
      setQuantity('')
      setReason('')
      setSelectedProduct(null)
      setProductQuery('')
      onRefresh?.()

      // Refocus search for next item
      searchInputRef.current?.focus()
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error al registrar el ingreso.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)

    if (!selectedProduct) {
      setFeedback({ type: 'error', message: 'Debes seleccionar un producto.' })
      return
    }

    const qty = parseInt(adjQuantity, 10)
    if (isNaN(qty) || qty < 0) {
      setFeedback({ type: 'error', message: 'La cantidad debe ser un número entero mayor o igual a 0.' })
      return
    }

    if (!adjReason.trim()) {
      setFeedback({ type: 'error', message: 'El motivo del ajuste es obligatorio (ej. Conteo físico, Rotura).' })
      return
    }

    try {
      setIsSubmitting(true)
      await onManualAdjustment({
        productId: selectedProduct.id,
        mode: adjMode,
        quantity: qty,
        reason: adjReason.trim(),
      })

      setFeedback({
        type: 'success',
        message: `¡Ajuste guardado! Stock de "${selectedProduct.name}" actualizado.`,
      })

      setAdjQuantity('')
      setAdjReason('')
      setSelectedProduct(null)
      setProductQuery('')
      onRefresh?.()
      searchInputRef.current?.focus()
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error al guardar el ajuste.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Entrada de Mercadería y Ajustes</h2>
          <p className="text-sm text-slate-500">
            Recepción rápida por teclado de compras a proveedores y correcciones de inventario.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <Button
            size="sm"
            variant={mode === 'entry' ? 'default' : 'ghost'}
            onClick={() => {
              setMode('entry')
              setFeedback(null)
            }}
            className="gap-2 text-xs"
          >
            <Truck className="h-3.5 w-3.5" />
            Ingreso por Compra
          </Button>
          <Button
            size="sm"
            variant={mode === 'adjustment' ? 'default' : 'ghost'}
            onClick={() => {
              setMode('adjustment')
              setFeedback(null)
            }}
            className="gap-2 text-xs"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Ajuste Manual
          </Button>
        </div>
      </div>

      {/* Main Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Card */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          {feedback && (
            <div
              className={`mb-4 p-3 rounded-lg border text-sm flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Product Omnibox Search */}
          <div className="relative mb-5">
            <label className="text-xs font-semibold text-slate-700 mb-1 block">
              1. Buscar Producto (Nombre o Código de Barras) *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                ref={searchInputRef}
                placeholder="Escribe para buscar (ej. 'disco', '779...')"
                value={productQuery}
                onChange={(e) => {
                  setProductQuery(e.target.value)
                  setIsDropdownOpen(true)
                  if (selectedProduct && e.target.value !== selectedProduct.name) {
                    setSelectedProduct(null)
                  }
                }}
                onFocus={() => setIsDropdownOpen(true)}
                className="pl-9 pr-4 font-medium"
              />
            </div>

            {/* Autocomplete Dropdown */}
            {isDropdownOpen && matchingProducts.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden divide-y divide-slate-100">
                {matchingProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProduct(p)}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-medium text-slate-900 text-sm group-hover:text-blue-700">
                        {p.name}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        {p.barcode && <span>Cod: {p.barcode}</span>}
                        <span>Costo: ${p.cost}</span>
                      </div>
                    </div>
                    <Badge variant={p.stock <= 5 ? 'warning' : 'outline'} className="text-xs">
                      Stock: {p.stock}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Product Card Banner */}
          {selectedProduct && (
            <div className="mb-5 p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-sm">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Producto Seleccionado
                </span>
                <span className="font-bold text-slate-900 text-base">{selectedProduct.name}</span>
                <div className="text-xs text-slate-500 mt-0.5">
                  Costo actual: ${selectedProduct.cost} &bull; Precio venta: ${selectedProduct.price}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Stock Actual</span>
                <Badge variant={selectedProduct.stock === 0 ? 'destructive' : selectedProduct.stock <= 5 ? 'warning' : 'success'}>
                  {selectedProduct.stock} unidades
                </Badge>
              </div>
            </div>
          )}

          {/* Form: Mode Entry */}
          {mode === 'entry' ? (
            <form onSubmit={handleEntrySubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">2. Proveedor Asociado</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">-- Sin proveedor / Compra directa --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.contact ? `(${s.contact})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">3. Cantidad Recibida *</label>
                  <Input
                    ref={quantityInputRef}
                    type="number"
                    step="1"
                    min="1"
                    placeholder="ej. 25"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Nuevo Costo Unitario ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Costo de compra"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  N° de Remito / Factura / Observación
                </label>
                <Input
                  placeholder="ej. Remito R-0001-00045129"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full gap-2 mt-2" disabled={isSubmitting || !selectedProduct}>
                <ArrowDownLeft className="h-4 w-4" />
                {isSubmitting ? 'Registrando...' : 'Registrar Ingreso de Stock'}
              </Button>
            </form>
          ) : (
            /* Form: Mode Adjustment */
            <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Tipo de Ajuste *</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={adjMode === 'SET' ? 'default' : 'outline'}
                    onClick={() => setAdjMode('SET')}
                  >
                    Fijar Conteo Total
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={adjMode === 'SUBTRACT' ? 'default' : 'outline'}
                    onClick={() => setAdjMode('SUBTRACT')}
                  >
                    Restar (Merma/Rotura)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={adjMode === 'ADD' ? 'default' : 'outline'}
                    onClick={() => setAdjMode('ADD')}
                  >
                    Sumar Unidades
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  {adjMode === 'SET'
                    ? 'Cantidad Real en Depósito *'
                    : adjMode === 'SUBTRACT'
                    ? 'Unidades a Descontar *'
                    : 'Unidades a Agregar *'}
                </label>
                <Input
                  ref={quantityInputRef}
                  type="number"
                  step="1"
                  min="0"
                  placeholder="0"
                  value={adjQuantity}
                  onChange={(e) => setAdjQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Motivo Obligatorio del Ajuste *</label>
                <Input
                  placeholder="ej. Mercadería dañada en descarga / Conteo físico"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" variant="secondary" className="w-full gap-2 mt-2" disabled={isSubmitting || !selectedProduct}>
                <SlidersHorizontal className="h-4 w-4" />
                {isSubmitting ? 'Guardando...' : 'Aplicar Ajuste de Stock'}
              </Button>
            </form>
          )}
        </div>

        {/* Right Audit Movements Card */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <History className="h-4 w-4 text-slate-500" />
              Historial de Movimientos Recientes
            </h3>
            <span className="text-xs text-slate-500">{movements.length} registrados</span>
          </div>

          <div className="flex-1 overflow-auto max-h-[460px]">
            {movements.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No hay movimientos de stock registrados todavía.
              </div>
            ) : (
              <div className="space-y-2.5">
                {movements.slice(0, 10).map((mov) => {
                  const product = products.find((p) => p.id === mov.productId)
                  const supplier = suppliers.find((s) => s.id === mov.supplierId)

                  return (
                    <div
                      key={mov.id}
                      className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-900">
                          {product ? product.name : `Producto ${mov.productId.slice(0, 6)}...`}
                        </div>
                        <div className="text-slate-500">
                          {supplier && <span className="mr-1.5 font-medium">Prov: {supplier.name}</span>}
                          {mov.reason && <span>{mov.reason}</span>}
                          {!supplier && !mov.reason && 'Sin observación'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(mov.date).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-xs inline-flex items-center gap-1 ${
                            mov.type === 'IN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : mov.type === 'OUT'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {mov.type === 'IN' ? (
                            <>
                              <ArrowDownLeft className="h-3 w-3" />+{mov.quantity}
                            </>
                          ) : mov.type === 'OUT' ? (
                            <>
                              <ArrowUpRight className="h-3 w-3" />-{mov.quantity}
                            </>
                          ) : (
                            <>
                              <SlidersHorizontal className="h-3 w-3" />
                              {mov.quantity}
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
