import React, { useState, useMemo, useRef, useEffect } from 'react'
import Fuse from 'fuse.js'
import { Product } from '@/core/domain/entities'
import { ProcessSaleDTO, ProcessSaleResult } from '@/core/use-cases'
import { PosCart, CartItem } from '@/core/domain/pos/cart'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Badge } from '@/presentation/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table'
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Barcode,
  CheckCircle,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  AlertCircle,
  Receipt as ReceiptIcon,
} from 'lucide-react'

interface PosViewProps {
  products: Product[]
  onProcessSale: (dto: ProcessSaleDTO) => Promise<ProcessSaleResult>
  onSaleSuccess?: (result: ProcessSaleResult) => void
}

export function PosView({ products, onProcessSale, onSaleSuccess }: PosViewProps) {
  // Cart state
  const [cart] = useState<PosCart>(() => new PosCart())
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartTotal, setCartTotal] = useState(0)

  // Omnibox state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const omniboxRef = useRef<HTMLInputElement>(null)

  // Payment state
  const [customerName, setCustomerName] = useState('Consumidor Final')
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'DEBITO' | 'TRANSFERENCIA'>('EFECTIVO')
  const [amountPaid, setAmountPaid] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Sync cart helper
  const syncCart = () => {
    setCartItems([...cart.items])
    setCartTotal(cart.total)
  }

  // Setup Fuse.js for Fuzzy Search
  const fuse = useMemo(() => {
    return new Fuse(products, {
      keys: ['name', 'barcode', 'description'],
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 2,
    })
  }, [products])

  // Fuzzy Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []

    // Direct exact barcode match
    const exactBarcode = products.find((p) => p.barcode === searchQuery.trim())
    if (exactBarcode) {
      return [exactBarcode]
    }

    const fuseResults = fuse.search(searchQuery.trim())
    return fuseResults.slice(0, 7).map((res) => res.item)
  }, [fuse, products, searchQuery])

  // Keyboard shortcut: F2 focuses omnibox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault()
        omniboxRef.current?.focus()
        omniboxRef.current?.select()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Auto focus omnibox on mount
  useEffect(() => {
    omniboxRef.current?.focus()
  }, [])

  // Add product to cart
  const handleAddProduct = (product: Product) => {
    setError(null)
    try {
      cart.addItem(product, 1)
      syncCart()
      setSearchQuery('')
      setIsDropdownOpen(false)
      setSelectedIndex(0)

      // Automatically prefill cash payment if amount empty or matches old total
      omniboxRef.current?.focus()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al agregar producto')
    }
  }

  // Handle Omnibox keyboard navigation (ArrowDown, ArrowUp, Enter)
  const handleOmniboxKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (searchResults.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % searchResults.length)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (searchResults.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length)
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (searchResults.length > 0) {
        const itemToAdd = searchResults[selectedIndex] || searchResults[0]
        if (itemToAdd) {
          handleAddProduct(itemToAdd)
        }
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false)
    }
  }

  const handleUpdateQty = (productId: string, qty: number) => {
    setError(null)
    try {
      cart.updateQuantity(productId, qty)
      syncCart()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al modificar cantidad')
    }
  }

  const handleRemoveItem = (productId: string) => {
    cart.removeItem(productId)
    syncCart()
  }

  const handleClearCart = () => {
    cart.clear()
    syncCart()
    setError(null)
  }

  // Change / Vuelto calculation
  const parsedAmountPaid = parseFloat(amountPaid) || 0
  const change = parsedAmountPaid > cartTotal ? parsedAmountPaid - cartTotal : 0

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (cartItems.length === 0) {
      setError('El carrito está vacío. Agrega productos con el buscador omnibox.')
      return
    }

    if (paymentMethod === 'EFECTIVO' && amountPaid && parsedAmountPaid < cartTotal) {
      setError('El monto abonado en efectivo es menor al total a pagar.')
      return
    }

    try {
      setIsProcessing(true)
      const result = await onProcessSale({
        customerName: customerName.trim() || 'Consumidor Final',
        paymentMethod,
        amountPaid: parsedAmountPaid > 0 ? parsedAmountPaid : cartTotal,
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      })

      // Clear cart on successful sale
      cart.clear()
      syncCart()
      setAmountPaid('')

      onSaleSuccess?.(result)
      omniboxRef.current?.focus()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar la venta.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header / Omnibox Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="omnibox-input" className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5" />
            Buscador Omnibox POS (F2 para enfocar)
          </label>
          <span className="text-xs text-slate-400">
            Fuzzy Search &bull; Teclea nombre, SKU o escanea código de barras
          </span>
        </div>

        {/* Giant Omnibox Input */}
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-6 w-6 text-slate-400 pointer-events-none" />
            <Input
              id="omnibox-input"
              ref={omniboxRef}
              placeholder="Teclea para buscar producto (ej. 'clav', 'tornillo') y presiona ENTER..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setIsDropdownOpen(true)
                setSelectedIndex(0)
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onKeyDown={handleOmniboxKeyDown}
              className="pl-13 pr-24 h-14 text-lg font-medium shadow-inner rounded-xl border-slate-300 focus-visible:ring-blue-600 focus-visible:border-blue-600"
              autoComplete="off"
            />
            <div className="absolute right-3 flex items-center gap-1.5 text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              <Barcode className="h-3.5 w-3.5" />
              <span>Lector Listo</span>
            </div>
          </div>

          {/* Omnibox Autocomplete Results Dropdown */}
          {isDropdownOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100">
              {searchResults.map((product, idx) => {
                const isSelected = idx === selectedIndex
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleAddProduct(product)}
                    className={`w-full text-left px-5 py-3 transition-colors flex items-center justify-between ${
                      isSelected ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 text-slate-900'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-base flex items-center gap-2">
                        <span>{product.name}</span>
                        {product.barcode && (
                          <span
                            className={`font-mono text-xs px-2 py-0.5 rounded ${
                              isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {product.barcode}
                          </span>
                        )}
                      </div>
                      {product.description && (
                        <div className={`text-xs ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                          {product.description}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="font-bold text-lg">
                          ${product.price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className={`text-xs ${isSelected ? 'text-blue-200' : 'text-slate-500'}`}>
                          Stock: {product.stock} u.
                        </div>
                      </div>
                      <Badge
                        variant={product.stock <= 0 ? 'destructive' : isSelected ? 'secondary' : 'default'}
                        className="text-xs"
                      >
                        {product.stock <= 0 ? 'Agotado' : 'Enter ↵'}
                      </Badge>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setError(null)} className="h-7 text-xs">
            Cerrar
          </Button>
        </div>
      )}

      {/* Main Grid: Cart (Left 7 cols) & Checkout Summary (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cart Table */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-slate-900">Carrito de Salida</h3>
              <Badge variant="outline" className="text-xs ml-1">
                {cartItems.reduce((acc, item) => acc + item.quantity, 0)} unidades
              </Badge>
            </div>

            {cartItems.length > 0 && (
              <Button size="sm" variant="ghost" onClick={handleClearCart} className="text-xs text-red-600 hover:text-red-700">
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Vaciar Carrito
              </Button>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artículo</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-center w-32">Cantidad</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cartItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-1">
                      <ShoppingCart className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-medium text-slate-600">El carrito de venta está vacío</p>
                      <p className="text-xs text-slate-400">
                        Escribe en el buscador omnibox de arriba y presiona Enter para sumar productos.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                cartItems.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell>
                      <div className="font-semibold text-slate-900 text-sm">{item.productName}</div>
                      <div className="text-xs text-slate-400">Máx disponible: {item.maxStock} u.</div>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      ${item.unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleUpdateQty(item.productId, item.quantity - 1)}
                          className="h-7 w-7 rounded"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-9 text-center font-bold text-sm text-slate-900">
                          {item.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleUpdateQty(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                          className="h-7 w-7 rounded"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-900 text-sm">
                      ${item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveItem(item.productId)}
                        className="h-8 w-8 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Right Checkout Panel */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <ReceiptIcon className="h-5 w-5 text-blue-600" />
              Finalizar Venta / Comprobante
            </h3>
            <p className="text-xs text-slate-500">
              Emisión de comprobante no fiscal y actualización automática de stock.
            </p>
          </div>

          <form onSubmit={handleCheckout} className="space-y-4">
            {/* Customer Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Cliente (Opcional)</label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nombre del cliente o razón social"
              />
            </div>

            {/* Payment Method Tabs */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Forma de Pago</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={paymentMethod === 'EFECTIVO' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('EFECTIVO')}
                  className="gap-1.5 text-xs"
                >
                  <Banknote className="h-3.5 w-3.5" />
                  Efectivo
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={paymentMethod === 'DEBITO' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('DEBITO')}
                  className="gap-1.5 text-xs"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  Débito / Tarj.
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={paymentMethod === 'TRANSFERENCIA' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('TRANSFERENCIA')}
                  className="gap-1.5 text-xs"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  Transferencia
                </Button>
              </div>
            </div>

            {/* Total Display */}
            <div className="p-4 bg-slate-900 text-white rounded-xl">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total a Cobrar</div>
              <div className="text-3xl font-extrabold tracking-tight mt-1">
                ${cartTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Cash Tendered & Change */}
            {paymentMethod === 'EFECTIVO' && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Abona con ($)</label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    placeholder={cartTotal.toString()}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="font-bold text-sm bg-white"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-xs font-semibold text-slate-500">Vuelto / Cambio</label>
                  <div className="text-lg font-extrabold text-emerald-600 mt-1">
                    ${change.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              disabled={isProcessing || cartItems.length === 0}
              className="w-full text-base font-bold h-12 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
            >
              <CheckCircle className="h-5 w-5" />
              {isProcessing ? 'Procesando Venta...' : 'Cobrar e Imprimir Ticket (F4)'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
