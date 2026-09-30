import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { CatalogView } from '@/presentation/views/catalog'
import { SuppliersView } from '@/presentation/views/suppliers/suppliers-view'
import { StockEntryView } from '@/presentation/views/stock-entry/stock-entry-view'
import { PosView, ReceiptDialog } from '@/presentation/views/pos'
import { DashboardView } from '@/presentation/views/dashboard'
import { SalesHistoryView } from '@/presentation/views/sales-history'
import { BackupDialog } from '@/presentation/components/backup-dialog'
import { ShortcutBar, TabType } from '@/presentation/components/shortcut-bar'
import { useGlobalShortcuts } from '@/presentation/hooks/use-global-shortcuts'
import { Package, ShoppingCart, Layers, Truck, LayoutDashboard, Wrench, ReceiptText, Database } from 'lucide-react'
import { Product, Supplier, StockMovement, Receipt, ReceiptItem } from '@/core/domain/entities'
import {
  CreateProductDTO,
  CreateSupplierDTO,
  RegisterStockEntryDTO,
  ManualStockAdjustmentDTO,
  ProcessSaleDTO,
  ProcessSaleResult,
} from '@/core/use-cases'
import { ReceiptFormatter, BackupService, BackupPayload } from '@/core/services'

// Initial seed products for rich initial experience
const initialProducts: Product[] = [
  new Product({
    id: 'p-1',
    name: 'Tornillo Autoperforante 1" x 100u',
    description: 'Caja x 100 unidades punta mecha',
    price: 3200,
    cost: 1650,
    stock: 45,
    barcode: '7791234567890',
  }),
  new Product({
    id: 'p-2',
    name: 'Clavos punta París 2 pulgadas',
    description: 'Bolsa x 1 kg',
    price: 2800,
    cost: 1400,
    stock: 4, // Alerta bajo stock
    barcode: '7799876543210',
  }),
  new Product({
    id: 'p-3',
    name: 'Cinta Aisladora 20m Negra',
    description: 'Ignífuga PVC alta resistencia',
    price: 1500,
    cost: 750,
    stock: 35,
    barcode: '7791112223334',
  }),
  new Product({
    id: 'p-4',
    name: 'Disco de Corte Fino 115mm (4.5")',
    description: 'Acero inoxidable 1.0mm',
    price: 1100,
    cost: 520,
    stock: 0, // Alerta sin stock
    barcode: '7795556667778',
  }),
  new Product({
    id: 'p-5',
    name: 'Martillo Galponero Mango Fibra 16oz',
    description: 'Uña curva con mango ergonómico',
    price: 14500,
    cost: 8200,
    stock: 12,
    barcode: '7794443332221',
  }),
]

const initialSuppliers: Supplier[] = [
  new Supplier({
    id: 's-1',
    name: 'Distribuidora San Martín S.A.',
    contact: 'Carlos Gómez (Vendedor)',
    phone: '11-4455-6677',
    email: 'ventas@sanmartin.com.ar',
    address: 'Av. Juan B. Justo 4500, CABA',
  }),
  new Supplier({
    id: 's-2',
    name: 'Fijaciones & Bulones del Plata',
    contact: 'María Laura',
    phone: '11-9988-7766',
    email: 'pedidos@delplata.com',
    address: 'Parque Industrial Burzaco',
  }),
]

const initialMovements: StockMovement[] = [
  new StockMovement({
    id: 'm-1',
    productId: 'p-1',
    supplierId: 's-2',
    type: 'IN',
    quantity: 50,
    reason: 'Remito R-0001-002341',
    date: new Date('2026-09-28T09:30:00'),
  }),
  new StockMovement({
    id: 'm-2',
    productId: 'p-4',
    type: 'MANUAL',
    quantity: 2,
    reason: 'Rotura durante acomodación en estantería',
    date: new Date('2026-09-29T14:15:00'),
  }),
]

const STORAGE_KEY = 'nahuem_data_v1'

const loadInitialData = (): {
  products: Product[]
  suppliers: Supplier[]
  movements: StockMovement[]
  receipts: Receipt[]
} => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return BackupService.importFromJson(raw)
    }
  } catch (err) {
    console.warn('No se pudo cargar desde localStorage, usando datos semilla:', err)
  }
  return {
    products: initialProducts,
    suppliers: initialSuppliers,
    movements: initialMovements,
    receipts: [],
  }
}

export function App() {
  const initial = useMemo(() => loadInitialData(), [])
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [products, setProducts] = useState<Product[]>(initial.products)
  const [suppliers, setSuppliers] = useState<Supplier[]>(initial.suppliers)
  const [movements, setMovements] = useState<StockMovement[]>(initial.movements)
  const [receipts, setReceipts] = useState<Receipt[]>(initial.receipts)
  const [selectedProductForEntry, setSelectedProductForEntry] = useState<string | null>(null)

  // Modals state
  const [currentSaleResult, setCurrentSaleResult] = useState<ProcessSaleResult | null>(null)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [isBackupOpen, setIsBackupOpen] = useState(false)

  // Auto-persist to localStorage on every change
  useEffect(() => {
    try {
      const serialized = BackupService.exportToJson({
        products,
        suppliers,
        movements,
        receipts,
      })
      localStorage.setItem(STORAGE_KEY, serialized)
    } catch (err) {
      console.error('Error guardando en localStorage:', err)
    }
  }, [products, suppliers, movements, receipts])

  useGlobalShortcuts({
    onNavigateDashboard: () => {
      setSelectedProductForEntry(null)
      setActiveTab('dashboard')
    },
    onNavigatePos: () => {
      setActiveTab('pos')
    },
    onNavigateEntries: () => {
      setSelectedProductForEntry(null)
      setActiveTab('entries')
    },
    onNavigateStock: () => {
      setActiveTab('stock')
    },
    onNavigateSales: () => {
      setActiveTab('sales')
    },
    onNavigateSuppliers: () => {
      setActiveTab('suppliers')
    },
    onEscape: () => {
      if (isReceiptOpen) setIsReceiptOpen(false)
      if (isBackupOpen) setIsBackupOpen(false)
    },
  })

  const handleCreateProduct = async (dto: CreateProductDTO): Promise<Product> => {
    if (dto.barcode && dto.barcode.trim()) {
      const exists = products.some((p) => p.barcode === dto.barcode?.trim())
      if (exists) {
        throw new Error(`Ya existe un producto con el código de barras "${dto.barcode.trim()}"`)
      }
    }

    const newProduct = new Product({
      id: crypto.randomUUID(),
      name: dto.name,
      description: dto.description,
      price: dto.price,
      cost: dto.cost,
      stock: dto.stock ?? 0,
      barcode: dto.barcode,
    })

    setProducts((prev) => [newProduct, ...prev])
    return newProduct
  }

  const handleCreateSupplier = async (dto: CreateSupplierDTO): Promise<Supplier> => {
    const newSupplier = new Supplier({
      id: crypto.randomUUID(),
      name: dto.name,
      contact: dto.contact,
      phone: dto.phone,
      email: dto.email,
      address: dto.address,
    })

    setSuppliers((prev) => [newSupplier, ...prev])
    return newSupplier
  }

  const handleRegisterStockEntry = async (dto: RegisterStockEntryDTO): Promise<Product> => {
    const index = products.findIndex((p) => p.id === dto.productId)
    if (index === -1) {
      throw new Error('Producto no encontrado')
    }

    const current = products[index]
    const updated = new Product({
      id: current.id,
      name: current.name,
      description: current.description,
      price: current.price,
      cost: dto.cost !== undefined ? dto.cost : current.cost,
      stock: current.stock + dto.quantity,
      barcode: current.barcode,
      categoryId: current.categoryId,
    })

    const newMovement = new StockMovement({
      id: crypto.randomUUID(),
      productId: current.id,
      supplierId: dto.supplierId,
      type: 'IN',
      quantity: dto.quantity,
      reason: dto.reason,
      date: dto.date ?? new Date(),
    })

    setProducts((prev) => {
      const copy = [...prev]
      copy[index] = updated
      return copy
    })

    setMovements((prev) => [newMovement, ...prev])
    return updated
  }

  const handleManualAdjustment = async (dto: ManualStockAdjustmentDTO): Promise<Product> => {
    const index = products.findIndex((p) => p.id === dto.productId)
    if (index === -1) {
      throw new Error('Producto no encontrado')
    }

    const current = products[index]
    let newStock = current.stock

    if (dto.mode === 'SET') {
      newStock = dto.quantity
    } else if (dto.mode === 'SUBTRACT') {
      if (current.stock - dto.quantity < 0) {
        throw new Error(`Stock insuficiente. Stock actual: ${current.stock}`)
      }
      newStock = current.stock - dto.quantity
    } else if (dto.mode === 'ADD') {
      newStock = current.stock + dto.quantity
    }

    const updated = new Product({
      id: current.id,
      name: current.name,
      description: current.description,
      price: current.price,
      cost: current.cost,
      stock: newStock,
      barcode: current.barcode,
      categoryId: current.categoryId,
    })

    const newMovement = new StockMovement({
      id: crypto.randomUUID(),
      productId: current.id,
      type: 'MANUAL',
      quantity: Math.abs(newStock - current.stock) || dto.quantity,
      reason: dto.reason,
      date: new Date(),
    })

    setProducts((prev) => {
      const copy = [...prev]
      copy[index] = updated
      return copy
    })

    setMovements((prev) => [newMovement, ...prev])
    return updated
  }

  const handleProcessSale = async (dto: ProcessSaleDTO): Promise<ProcessSaleResult> => {
    // 1. Verify stocks
    for (const item of dto.items) {
      const prod = products.find((p) => p.id === item.productId)
      if (!prod) {
        throw new Error(`Producto ${item.productId} no encontrado`)
      }
      if (prod.stock < item.quantity) {
        throw new Error(`Stock insuficiente para "${prod.name}". Disponible: ${prod.stock}, solicitado: ${item.quantity}`)
      }
    }

    // 2. Deduct stocks and create receipt
    const receiptId = crypto.randomUUID()
    const receiptItems: ReceiptItem[] = []
    const newMovements: StockMovement[] = []
    const updatedProductsList: Product[] = []
    const itemsDetail: Array<{ name: string; quantity: number; unitPrice: number; subtotal: number }> = []

    setProducts((prev) => {
      const next = [...prev]
      for (const item of dto.items) {
        const idx = next.findIndex((p) => p.id === item.productId)
        const currentProd = next[idx]

        const updatedProd = new Product({
          id: currentProd.id,
          name: currentProd.name,
          description: currentProd.description,
          price: currentProd.price,
          cost: currentProd.cost,
          stock: currentProd.stock - item.quantity,
          barcode: currentProd.barcode,
          categoryId: currentProd.categoryId,
        })
        next[idx] = updatedProd
        updatedProductsList.push(updatedProd)

        const rItem = new ReceiptItem({
          id: crypto.randomUUID(),
          receiptId,
          productId: currentProd.id,
          quantity: item.quantity,
          unitPrice: currentProd.price,
        })
        receiptItems.push(rItem)

        itemsDetail.push({
          name: currentProd.name,
          quantity: item.quantity,
          unitPrice: currentProd.price,
          subtotal: rItem.subtotal,
        })

        newMovements.push(
          new StockMovement({
            id: crypto.randomUUID(),
            productId: currentProd.id,
            type: 'OUT',
            quantity: item.quantity,
            reason: `Venta Ticket #${receiptId.slice(0, 8).toUpperCase()}`,
            date: new Date(),
          })
        )
      }
      return next
    })

    const receipt = new Receipt({
      id: receiptId,
      customerName: dto.customerName || 'Consumidor Final',
      items: receiptItems,
      date: new Date(),
    })

    setReceipts((prev) => [receipt, ...prev])
    setMovements((prev) => [...newMovements, ...prev])

    const change =
      dto.amountPaid !== undefined && dto.amountPaid >= receipt.totalAmount
        ? dto.amountPaid - receipt.totalAmount
        : 0

    const ticketText = ReceiptFormatter.formatThermalTicket({
      receipt,
      paymentMethod: dto.paymentMethod,
      amountPaid: dto.amountPaid,
      change,
      itemsDetail,
    })

    const result: ProcessSaleResult = {
      receipt,
      updatedProducts: updatedProductsList,
      change,
      ticketText,
    }

    setCurrentSaleResult(result)
    setIsReceiptOpen(true)

    return result
  }

  const handleViewReceipt = (receipt: Receipt) => {
    const itemsDetail = receipt.items.map((item) => {
      const prod = products.find((p) => p.id === item.productId)
      return {
        name: prod?.name || 'Artículo',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      }
    })
    const ticketText = ReceiptFormatter.formatThermalTicket({
      receipt,
      paymentMethod: 'Efectivo',
      amountPaid: receipt.totalAmount,
      change: 0,
      itemsDetail,
    })
    setCurrentSaleResult({
      receipt,
      updatedProducts: [],
      change: 0,
      ticketText,
    })
    setIsReceiptOpen(true)
  }

  const handleVoidSale = async (receiptId: string, reason?: string) => {
    const rIdx = receipts.findIndex((r) => r.id === receiptId)
    if (rIdx === -1) throw new Error('Comprobante no encontrado')

    const targetReceipt = receipts[rIdx]
    if (targetReceipt.status === 'CANCELLED') {
      throw new Error('El comprobante ya se encuentra anulado')
    }

    targetReceipt.cancel(reason)

    const newMovements: StockMovement[] = []
    setProducts((prev) => {
      const next = [...prev]
      for (const item of targetReceipt.items) {
        const pIdx = next.findIndex((p) => p.id === item.productId)
        if (pIdx !== -1) {
          const currentP = next[pIdx]
          const updatedP = new Product({
            id: currentP.id,
            name: currentP.name,
            description: currentP.description,
            price: currentP.price,
            cost: currentP.cost,
            stock: currentP.stock + item.quantity,
            barcode: currentP.barcode,
            categoryId: currentP.categoryId,
          })
          next[pIdx] = updatedP

          newMovements.push(
            new StockMovement({
              id: crypto.randomUUID(),
              productId: currentP.id,
              type: 'IN',
              quantity: item.quantity,
              reason: `Anulación Venta Ticket #${targetReceipt.id.slice(0, 8).toUpperCase()}${reason ? `: ${reason}` : ''}`,
              date: new Date(),
            })
          )
        }
      }
      return next
    })

    setReceipts((prev) => {
      const copy = [...prev]
      copy[rIdx] = targetReceipt
      return copy
    })

    setMovements((prev) => [...newMovements, ...prev])
  }

  const handleRestoreBackup = (payload: BackupPayload) => {
    setProducts(payload.products)
    setSuppliers(payload.suppliers)
    setMovements(payload.movements)
    setReceipts(payload.receipts)
  }

  // Stock metrics
  const lowStockCount = useMemo(() => products.filter((p) => p.stock > 0 && p.stock <= 5).length, [products])
  const outOfStockCount = useMemo(() => products.filter((p) => p.stock === 0).length, [products])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-sm sticky top-0 z-30 print:hidden">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-700 to-slate-900 text-white p-2.5 rounded-xl font-bold flex items-center justify-center shadow-sm border border-blue-600/30">
            <Wrench className="h-5 w-5 text-amber-400 -rotate-12" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                Ferretería Nahuem
              </h1>
              <span className="text-[10px] uppercase font-mono font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                Local
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Control de Stock, Caja y Comprobantes</p>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <Button
            variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('dashboard')}
            className="gap-2 text-xs"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Inicio (F1)
            {(lowStockCount > 0 || outOfStockCount > 0) && (
              <span className="flex h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white ml-0.5" />
            )}
          </Button>
          <Button
            variant={activeTab === 'pos' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('pos')}
            className="gap-2 text-xs"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Punto de Venta (F2)
          </Button>
          <Button
            variant={activeTab === 'entries' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setSelectedProductForEntry(null)
              setActiveTab('entries')
            }}
            className="gap-2 text-xs"
          >
            <Truck className="h-3.5 w-3.5" />
            Ingreso Stock (F3)
          </Button>
          <Button
            variant={activeTab === 'stock' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('stock')}
            className="gap-2 text-xs"
          >
            <Package className="h-3.5 w-3.5" />
            Inventario (F4)
          </Button>
          <Button
            variant={activeTab === 'sales' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('sales')}
            className="gap-2 text-xs"
          >
            <ReceiptText className="h-3.5 w-3.5" />
            Ventas (F5)
          </Button>
          <Button
            variant={activeTab === 'suppliers' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('suppliers')}
            className="gap-2 text-xs"
          >
            <Layers className="h-3.5 w-3.5" />
            Proveedores ({suppliers.length})
          </Button>
        </nav>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBackupOpen(true)}
            className="gap-1.5 text-xs border-slate-300 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 shadow-2xs"
          >
            <Database className="h-3.5 w-3.5 text-blue-600" />
            <span className="hidden sm:inline">Respaldos</span>
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {activeTab === 'dashboard' && (
          <DashboardView
            products={products}
            receipts={receipts}
            onNavigate={(tab) => {
              setSelectedProductForEntry(null)
              setActiveTab(tab)
            }}
            onSelectProductForEntry={(productId) => {
              setSelectedProductForEntry(productId)
              setActiveTab('entries')
            }}
            onViewReceipt={handleViewReceipt}
          />
        )}

        {activeTab === 'pos' && (
          <PosView
            products={products}
            onProcessSale={handleProcessSale}
          />
        )}

        {activeTab === 'entries' && (
          <StockEntryView
            products={products}
            suppliers={suppliers}
            movements={movements}
            initialProductId={selectedProductForEntry}
            onRegisterEntry={handleRegisterStockEntry}
            onManualAdjustment={handleManualAdjustment}
          />
        )}

        {activeTab === 'stock' && (
          <CatalogView
            products={products}
            onCreateProduct={handleCreateProduct}
          />
        )}

        {activeTab === 'sales' && (
          <SalesHistoryView
            receipts={receipts}
            products={products}
            onViewReceipt={handleViewReceipt}
            onVoidSale={handleVoidSale}
            onNavigate={(tab) => {
              setSelectedProductForEntry(null)
              setActiveTab(tab)
            }}
          />
        )}

        {activeTab === 'suppliers' && (
          <SuppliersView
            suppliers={suppliers}
            onCreateSupplier={handleCreateSupplier}
          />
        )}
      </main>

      {/* Sticky Bottom Shortcut Bar */}
      <ShortcutBar
        activeTab={activeTab}
        onTabChange={(tab: TabType) => {
          setSelectedProductForEntry(null)
          setActiveTab(tab)
        }}
        onOpenBackup={() => setIsBackupOpen(true)}
      />

      {/* Printable Receipt Modal */}
      <ReceiptDialog
        saleResult={currentSaleResult}
        products={products}
        open={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />

      {/* Backup & Restore Modal */}
      <BackupDialog
        open={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        products={products}
        suppliers={suppliers}
        movements={movements}
        receipts={receipts}
        onRestoreBackup={handleRestoreBackup}
      />
    </div>
  )
}

export default App
