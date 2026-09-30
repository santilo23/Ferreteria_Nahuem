import { useState, useMemo } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { CatalogView } from '@/presentation/views/catalog'
import { SuppliersView } from '@/presentation/views/suppliers/suppliers-view'
import { Package, ShoppingCart, Layers, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Product, Supplier } from '@/core/domain/entities'
import { CreateProductDTO, CreateSupplierDTO } from '@/core/use-cases'

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

export function App() {
  const [activeTab, setActiveTab] = useState<'pos' | 'stock' | 'suppliers' | 'reports'>('stock')
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers)

  const handleCreateProduct = async (dto: CreateProductDTO): Promise<Product> => {
    // Check barcode uniqueness
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

  // Stock metrics
  const lowStockCount = useMemo(() => products.filter((p) => p.stock > 0 && p.stock <= 5).length, [products])
  const outOfStockCount = useMemo(() => products.filter((p) => p.stock === 0).length, [products])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg font-bold flex items-center justify-center shadow-sm">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Ferretería Nahuem</h1>
            <p className="text-xs text-slate-500">Control de Stock y Gestión Local</p>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <Button
            variant={activeTab === 'pos' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('pos')}
            className="gap-2 text-xs"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Punto de Venta
          </Button>
          <Button
            variant={activeTab === 'stock' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('stock')}
            className="gap-2 text-xs"
          >
            <Package className="h-3.5 w-3.5" />
            Inventario ({products.length})
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
          <Button
            variant={activeTab === 'reports' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('reports')}
            className="gap-2 text-xs"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Métricas
            {(lowStockCount > 0 || outOfStockCount > 0) && (
              <span className="flex h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white ml-0.5" />
            )}
          </Button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {activeTab === 'stock' && (
          <CatalogView
            products={products}
            onCreateProduct={handleCreateProduct}
          />
        )}

        {activeTab === 'suppliers' && (
          <SuppliersView
            suppliers={suppliers}
            onCreateSupplier={handleCreateSupplier}
          />
        )}

        {activeTab === 'pos' && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-lg mx-auto mt-12 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Módulo de Punto de Venta (POS)</h3>
            <p className="text-sm text-slate-600 mb-4">
              En la <strong>Etapa 5</strong> implementaremos el Omnibox con Fuzzy Search optimizado para teclado y emisión de comprobantes.
            </p>
            <Button onClick={() => setActiveTab('stock')} variant="outline">
              Ir al Catálogo de Inventario
            </Button>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Métricas y Alertas de Inventario</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500">Total Artículos</div>
                  <div className="text-2xl font-bold text-slate-900">{products.length}</div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500">Artículos con Bajo Stock (&le; 5)</div>
                  <div className="text-2xl font-bold text-amber-600">{lowStockCount}</div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500">Artículos Agotados (0)</div>
                  <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
                </div>
              </div>
            </div>

            {/* List of critical products */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Artículos que requieren reposición inmediata
              </h3>
              <div className="divide-y divide-slate-100">
                {products
                  .filter((p) => p.stock <= 5)
                  .map((p) => (
                    <div key={p.id} className="py-2.5 flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium text-slate-900">{p.name}</span>
                        {p.barcode && <span className="text-xs text-slate-400 ml-2 font-mono">{p.barcode}</span>}
                      </div>
                      <span className={`font-semibold ${p.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                        {p.stock === 0 ? 'Agotado (0 unid.)' : `${p.stock} unid. restantes`}
                      </span>
                    </div>
                  ))}
                {products.filter((p) => p.stock <= 5).length === 0 && (
                  <p className="text-sm text-slate-500 py-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Todos los artículos tienen stock suficiente.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
