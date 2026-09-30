import { useMemo } from 'react'
import { Product, Receipt } from '@/core/domain/entities'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/presentation/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table'
import {
  Package,
  ShoppingCart,
  Truck,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ReceiptText,
  DollarSign,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

interface DashboardViewProps {
  products: Product[]
  receipts: Receipt[]
  onNavigate: (tab: 'pos' | 'stock' | 'entries' | 'suppliers') => void
  onSelectProductForEntry?: (productId: string) => void
  onViewReceipt?: (receipt: Receipt) => void
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

const isSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate()

export function DashboardView({
  products,
  receipts,
  onNavigate,
  onSelectProductForEntry,
  onViewReceipt,
}: DashboardViewProps) {
  const today = useMemo(() => new Date(), [])

  // Today's metrics (excluding cancelled receipts)
  const todayReceipts = useMemo(() => {
    return receipts.filter((r) => isSameDay(new Date(r.date), today) && r.status !== 'CANCELLED')
  }, [receipts, today])

  const todaySalesTotal = useMemo(() => {
    return todayReceipts.reduce((sum, r) => sum + r.totalAmount, 0)
  }, [todayReceipts])

  // Inventory metrics
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.stock > 0 && p.stock <= 5)
  }, [products])

  const outOfStockProducts = useMemo(() => {
    return products.filter((p) => p.stock === 0)
  }, [products])

  const criticalProducts = useMemo(() => {
    return [...outOfStockProducts, ...lowStockProducts].sort((a, b) => a.stock - b.stock)
  }, [outOfStockProducts, lowStockProducts])

  // Valuation
  const totalValuationCost = useMemo(() => {
    return products.reduce((sum, p) => sum + p.cost * p.stock, 0)
  }, [products])

  const totalValuationRetail = useMemo(() => {
    return products.reduce((sum, p) => sum + p.price * p.stock, 0)
  }, [products])

  // Recent sales (up to 5)
  const recentReceipts = useMemo(() => {
    return [...receipts]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  }, [receipts])

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <Sparkles className="h-3 w-3 mr-1 text-blue-400" /> Sistema Local Operativo
            </span>
            <span className="text-xs text-slate-400">
              {today.toLocaleDateString('es-AR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Panel Principal</h2>
          <p className="text-sm text-slate-300 max-w-xl">
            Control integral del mostrador, seguimiento de ventas del día y alertas tempranas de reposición.
          </p>
        </div>

        {/* Fast Action Tiles */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => onNavigate('pos')}
            className="bg-blue-600 hover:bg-blue-500 text-white shadow-sm font-semibold gap-2 transition-all hover:scale-[1.02]"
          >
            <ShoppingCart className="h-4 w-4" />
            Venta Rápida
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-blue-700 rounded border border-blue-500">
              F2
            </kbd>
          </Button>

          <Button
            onClick={() => onNavigate('entries')}
            variant="outline"
            className="bg-slate-800/80 hover:bg-slate-800 text-slate-100 border-slate-700 font-semibold gap-2 transition-all hover:scale-[1.02]"
          >
            <Truck className="h-4 w-4 text-emerald-400" />
            Ingreso Stock
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-900 rounded border border-slate-700 text-slate-300">
              F3
            </kbd>
          </Button>

          <Button
            onClick={() => onNavigate('stock')}
            variant="outline"
            className="bg-slate-800/80 hover:bg-slate-800 text-slate-100 border-slate-700 font-semibold gap-2 transition-all hover:scale-[1.02]"
          >
            <Package className="h-4 w-4 text-amber-400" />
            Inventario
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-900 rounded border border-slate-700 text-slate-300">
              F4
            </kbd>
          </Button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Ventas de Hoy */}
        <Card className="border-slate-200 shadow-sm hover:shadow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Ventas de Hoy
            </CardTitle>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {formatCurrency(todaySalesTotal)}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <ReceiptText className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-semibold text-slate-700 font-mono">{todayReceipts.length}</span> comprobantes emitidos hoy
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Total Productos */}
        <Card className="border-slate-200 shadow-sm hover:shadow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Productos
            </CardTitle>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Package className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-slate-900">{products.length}</div>
            <p className="text-xs text-slate-500 mt-1">
              En catálogo y listados para mostrador
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: Bajo Stock */}
        <Card className={`border-slate-200 shadow-sm hover:shadow transition-shadow ${lowStockProducts.length > 0 ? 'bg-amber-50/40 border-amber-200' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Bajo Stock
            </CardTitle>
            <div className="p-2 bg-amber-100/80 rounded-lg text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-amber-700">
              {lowStockProducts.length}
            </div>
            <p className="text-xs text-amber-800/80 mt-1">
              Artículos con 5 o menos unidades
            </p>
          </CardContent>
        </Card>

        {/* Metric 4: Agotados */}
        <Card className={`border-slate-200 shadow-sm hover:shadow transition-shadow ${outOfStockProducts.length > 0 ? 'bg-rose-50/50 border-rose-200' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-rose-700">
              Agotados
            </CardTitle>
            <div className="p-2 bg-rose-100/80 rounded-lg text-rose-700">
              <Package className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-rose-700">
              {outOfStockProducts.length}
            </div>
            <p className="text-xs text-rose-800/80 mt-1">
              Artículos sin existencias (0 unidades)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Row: Inventory Valuation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-100/80 border border-slate-200/80 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-700 shadow-xs">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Valuación del Stock a Precio de Venta</p>
              <p className="text-lg font-bold font-mono text-slate-900">{formatCurrency(totalValuationRetail)}</p>
            </div>
          </div>
          <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-1 rounded">
            PVP Estimado
          </span>
        </div>

        <div className="bg-slate-100/80 border border-slate-200/80 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-700 shadow-xs">
              <DollarSign className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Capital Invertido a Precio de Costo</p>
              <p className="text-lg font-bold font-mono text-slate-900">{formatCurrency(totalValuationCost)}</p>
            </div>
          </div>
          <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-2 py-1 rounded">
            Costo Neto
          </span>
        </div>
      </div>

      {/* Main Section: Alerts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Critical Stock Replenishment (7 cols) */}
        <Card className="lg:col-span-7 border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Alertas de Reposición Crítica
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Productos con existencias agotadas o por debajo del umbral mínimo de seguridad.
              </CardDescription>
            </div>
            {criticalProducts.length > 0 && (
              <Badge variant="destructive" className="font-mono text-xs">
                {criticalProducts.length} urgentes
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {criticalProducts.length > 0 ? (
              <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-slate-50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="text-xs">Producto / Código</TableHead>
                      <TableHead className="text-xs text-center w-24">Estado</TableHead>
                      <TableHead className="text-xs text-right w-24">Stock</TableHead>
                      <TableHead className="text-xs text-right w-24">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {criticalProducts.map((p) => (
                      <TableRow key={p.id} className="hover:bg-slate-50/80">
                        <TableCell className="py-2.5">
                          <p className="font-medium text-xs text-slate-900">{p.name}</p>
                          {p.barcode ? (
                            <span className="text-[11px] font-mono text-slate-400">{p.barcode}</span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Sin código</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5 text-center">
                          {p.stock === 0 ? (
                            <Badge variant="destructive" className="text-[10px] uppercase tracking-wider py-0 px-1.5">
                              Sin Stock
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800 border-amber-200 py-0 px-1.5">
                              Bajo Stock
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5 text-right font-mono font-bold text-xs">
                          <span className={p.stock === 0 ? 'text-rose-600' : 'text-amber-600'}>
                            {p.stock} u.
                          </span>
                        </TableCell>
                        <TableCell className="py-2.5 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2.5 border-slate-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                            onClick={() => {
                              if (onSelectProductForEntry) {
                                onSelectProductForEntry(p.id)
                              } else {
                                onNavigate('entries')
                              }
                            }}
                          >
                            Reponer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-12 text-center flex flex-col items-center justify-center p-6 space-y-2">
                <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="font-semibold text-sm text-slate-800">
                  ¡Todos los artículos tienen stock suficiente!
                </h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  No hay productos con existencias en cero ni en niveles críticos por el momento.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Recent Sales Activity (5 cols) */}
        <Card className="lg:col-span-5 border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ReceiptText className="h-4 w-4 text-blue-600" />
                Últimas Ventas
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Tickets emitidos recientemente en el mostrador.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-blue-600 hover:text-blue-700 p-0 h-auto font-medium"
              onClick={() => onNavigate('pos')}
            >
              Nueva <ArrowRight className="h-3 w-3 ml-0.5 inline" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentReceipts.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentReceipts.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{r.customerName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          #{r.id.slice(0, 6).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {new Date(r.date).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        · {r.items.length} {r.items.length === 1 ? 'artículo' : 'artículos'}
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="font-mono font-bold text-slate-900 text-sm">
                        {formatCurrency(r.totalAmount)}
                      </div>
                      {onViewReceipt && (
                        <button
                          onClick={() => onViewReceipt(r)}
                          className="text-[11px] text-blue-600 hover:underline font-medium"
                        >
                          Ver Ticket
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center flex flex-col items-center justify-center p-6 space-y-2">
                <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                  <ReceiptText className="h-5 w-5" />
                </div>
                <h4 className="font-semibold text-sm text-slate-800">Sin ventas registradas aún</h4>
                <p className="text-xs text-slate-500 max-w-xs">
                  Las ventas cobradas en el Punto de Venta aparecerán aquí con sus totales correspondientes.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate('pos')}
                  className="mt-2 text-xs gap-1.5"
                >
                  <ShoppingCart className="h-3.5 w-3.5 text-blue-600" />
                  Ir al Punto de Venta
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
