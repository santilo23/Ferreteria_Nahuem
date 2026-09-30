import { useState, useMemo } from 'react'
import { Product } from '@/core/domain/entities'
import { CreateProductDTO } from '@/core/use-cases'
import { Input } from '@/presentation/components/ui/input'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table'
import { NewProductDialog } from './new-product-dialog'
import { Search, AlertTriangle, PackageX, ChevronLeft, ChevronRight, Barcode } from 'lucide-react'

interface CatalogViewProps {
  products: Product[]
  onCreateProduct: (dto: CreateProductDTO) => Promise<Product>
  onRefresh?: () => void
}

const ITEMS_PER_PAGE = 8

export function CatalogView({ products, onCreateProduct, onRefresh }: CatalogViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Filter products by search term and stock filter
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Stock filter
      if (stockFilter === 'low' && (product.stock > 5 || product.stock === 0)) {
        return false
      }
      if (stockFilter === 'out' && product.stock !== 0) {
        return false
      }

      // Search term
      if (!searchTerm.trim()) return true
      const term = searchTerm.toLowerCase()
      return (
        product.name.toLowerCase().includes(term) ||
        (product.description && product.description.toLowerCase().includes(term)) ||
        (product.barcode && product.barcode.toLowerCase().includes(term))
      )
    })
  }, [products, searchTerm, stockFilter])

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredProducts, currentPage])

  // Count metrics
  const lowStockCount = useMemo(() => products.filter((p) => p.stock > 0 && p.stock <= 5).length, [products])
  const outOfStockCount = useMemo(() => products.filter((p) => p.stock === 0).length, [products])

  const handleSearchChange = (val: string) => {
    setSearchTerm(val)
    setCurrentPage(1)
  }

  const handleFilterChange = (filter: 'all' | 'low' | 'out') => {
    setStockFilter(filter)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Top action & filter bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Catálogo de Productos</h2>
          <p className="text-sm text-slate-500">
            Consulta y administración del inventario, precios y existencias.
          </p>
        </div>

        <NewProductDialog onCreateProduct={onCreateProduct} onSuccess={onRefresh} />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nombre, código de barras o descripción..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={stockFilter === 'all' ? 'default' : 'outline'}
            onClick={() => handleFilterChange('all')}
          >
            Todos ({products.length})
          </Button>
          <Button
            size="sm"
            variant={stockFilter === 'low' ? 'default' : 'outline'}
            onClick={() => handleFilterChange('low')}
            className={stockFilter === 'low' ? '' : 'text-amber-700 hover:text-amber-800'}
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
            Bajo Stock ({lowStockCount})
          </Button>
          <Button
            size="sm"
            variant={stockFilter === 'out' ? 'default' : 'outline'}
            onClick={() => handleFilterChange('out')}
            className={stockFilter === 'out' ? '' : 'text-red-700 hover:text-red-800'}
          >
            <PackageX className="h-3.5 w-3.5 mr-1" />
            Sin Stock ({outOfStockCount})
          </Button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Código de Barras</TableHead>
              <TableHead className="text-right">Precio Venta</TableHead>
              <TableHead className="text-right">Costo</TableHead>
              <TableHead className="text-right">Margen</TableHead>
              <TableHead className="text-center">Estado Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  {products.length === 0
                    ? 'No hay productos registrados en el inventario. Agrega el primero con el botón "+ Nuevo Producto".'
                    : 'No se encontraron productos que coincidan con los filtros aplicados.'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((product) => {
                const margin = product.cost > 0
                  ? (((product.price - product.cost) / product.cost) * 100).toFixed(0)
                  : '100'

                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">{product.name}</div>
                      {product.description && (
                        <div className="text-xs text-slate-500">{product.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.barcode ? (
                        <span className="font-mono text-xs flex items-center gap-1 text-slate-600">
                          <Barcode className="h-3.5 w-3.5 text-slate-400" />
                          {product.barcode}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Sin código</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${product.price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right text-slate-600">
                      ${product.cost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        +{margin}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {product.stock === 0 ? (
                        <Badge variant="destructive">0 unid. (Agotado)</Badge>
                      ) : product.stock <= 5 ? (
                        <Badge variant="warning">{product.stock} unid. (Bajo)</Badge>
                      ) : (
                        <Badge variant="success">{product.stock} unid.</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {/* Local Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 text-sm">
            <span className="text-slate-600">
              Mostrando {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredProducts.length)} a{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} de{' '}
              {filteredProducts.length} productos
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-xs font-medium text-slate-700">
                Pág. {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="gap-1"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
