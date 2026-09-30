import { useState, useMemo } from 'react'
import { Product, Receipt } from '@/core/domain/entities'
import { BackupService } from '@/core/services'
import { PrintService } from '@/presentation/lib/print-service'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/presentation/components/ui/dialog'
import {
  ReceiptText,
  Search,
  Printer,
  Ban,
  FileSpreadsheet,
  AlertTriangle,
  ShoppingCart,
  Calendar,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

interface SalesHistoryViewProps {
  receipts: Receipt[]
  products?: Product[]
  onViewReceipt: (receipt: Receipt) => void
  onVoidSale: (receiptId: string, reason?: string) => Promise<void>
  onNavigate: (tab: 'pos' | 'stock' | 'entries' | 'suppliers') => void
}

export function SalesHistoryView({
  receipts,
  products: _products,
  onViewReceipt,
  onVoidSale,
  onNavigate,
}: SalesHistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all')

  // Void modal state
  const [selectedReceiptToVoid, setSelectedReceiptToVoid] = useState<Receipt | null>(null)
  const [voidReason, setVoidReason] = useState('')
  const [isVoiding, setIsVoiding] = useState(false)
  const [voidError, setVoidError] = useState<string | null>(null)

  // Filtered receipts
  const activeCount = useMemo(() => receipts.filter((r) => r.status !== 'CANCELLED').length, [receipts])
  const cancelledCount = useMemo(() => receipts.filter((r) => r.status === 'CANCELLED').length, [receipts])

  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      // Status filter
      if (statusFilter === 'completed' && r.status === 'CANCELLED') return false
      if (statusFilter === 'cancelled' && r.status !== 'CANCELLED') return false

      // Search query
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      const matchId = r.id.toLowerCase().includes(q)
      const matchCustomer = (r.customerName || 'consumidor final').toLowerCase().includes(q)
      return matchId || matchCustomer
    })
  }, [receipts, statusFilter, searchQuery])

  const handleExportCsv = () => {
    const csv = BackupService.exportSalesToCsv(receipts)
    const dateStr = new Date().toISOString().slice(0, 10)
    PrintService.downloadTicketFile(`ventas_nahuem_${dateStr}.csv`, csv)
  }

  const handleOpenVoidModal = (receipt: Receipt) => {
    setSelectedReceiptToVoid(receipt)
    setVoidReason('')
    setVoidError(null)
  }

  const handleConfirmVoid = async () => {
    if (!selectedReceiptToVoid) return
    setIsVoiding(true)
    setVoidError(null)
    try {
      await onVoidSale(selectedReceiptToVoid.id, voidReason)
      setSelectedReceiptToVoid(null)
    } catch (err: any) {
      setVoidError(err.message || 'Error al anular la venta')
    } finally {
      setIsVoiding(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Historial de Ventas</h2>
            <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
              {receipts.length} comprobantes
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Consulta, reimpresión y anulación de comprobantes emitidos en el mostrador.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="gap-2 text-xs border-slate-300 hover:bg-slate-50"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Exportar Ventas (CSV)
          </Button>
          <Button
            size="sm"
            onClick={() => onNavigate('pos')}
            className="gap-2 text-xs bg-blue-600 hover:bg-blue-700 font-semibold"
          >
            <ShoppingCart className="h-4 w-4" />
            Nueva Venta (F2)
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por #Ticket o cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
            className="text-xs h-8"
          >
            Todas ({receipts.length})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'completed' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('completed')}
            className={`text-xs h-8 ${statusFilter === 'completed' ? '' : 'text-emerald-700 hover:text-emerald-800'}`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Activas ({activeCount})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'cancelled' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('cancelled')}
            className={`text-xs h-8 ${statusFilter === 'cancelled' ? '' : 'text-rose-700 hover:text-rose-800'}`}
          >
            <XCircle className="h-3.5 w-3.5 mr-1" />
            Anuladas ({cancelledCount})
          </Button>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="text-xs font-semibold">Ticket / Comprobante</TableHead>
              <TableHead className="text-xs font-semibold">Fecha y Hora</TableHead>
              <TableHead className="text-xs font-semibold">Cliente</TableHead>
              <TableHead className="text-xs font-semibold text-center">Artículos</TableHead>
              <TableHead className="text-xs font-semibold text-right">Total</TableHead>
              <TableHead className="text-xs font-semibold text-center">Estado</TableHead>
              <TableHead className="text-xs font-semibold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReceipts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <ReceiptText className="h-8 w-8 text-slate-300 mb-1" />
                    <p className="font-medium text-slate-700">No se encontraron ventas</p>
                    <p className="text-xs text-slate-400">
                      {receipts.length === 0
                        ? 'Aún no se ha registrado ninguna venta en el sistema.'
                        : 'No hay ventas que coincidan con la búsqueda o filtro seleccionado.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredReceipts.map((r) => {
                const isCancelled = r.status === 'CANCELLED'
                const dateObj = new Date(r.date)

                return (
                  <TableRow key={r.id} className={isCancelled ? 'bg-rose-50/20 opacity-75' : 'hover:bg-slate-50/80'}>
                    <TableCell className="font-mono text-xs font-bold text-slate-900">
                      #{r.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span>{dateObj.toLocaleDateString('es-AR')}</span>
                        <span className="text-slate-400 font-mono">
                          {dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-900">
                      {r.customerName || 'Consumidor Final'}
                    </TableCell>
                    <TableCell className="text-xs text-center font-mono text-slate-600">
                      {r.items.reduce((sum, item) => sum + item.quantity, 0)} u.
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-sm text-slate-900">
                      ${r.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                      {isCancelled ? (
                        <Badge variant="destructive" className="text-[10px] uppercase font-mono tracking-wider">
                          Anulada
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-[10px] uppercase font-mono tracking-wider">
                          Completada
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewReceipt(r)}
                          className="h-7 text-xs px-2.5 gap-1 border-slate-300 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Printer className="h-3 w-3" />
                          Reimprimir
                        </Button>

                        {!isCancelled && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenVoidModal(r)}
                            className="h-7 text-xs px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            title="Anular venta y restituir stock"
                          >
                            <Ban className="h-3 w-3 mr-1" />
                            Anular Venta
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Modal for Voiding a Sale */}
      {selectedReceiptToVoid && (
        <Dialog open={Boolean(selectedReceiptToVoid)} onOpenChange={() => setSelectedReceiptToVoid(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 text-rose-600 mb-1">
                <AlertTriangle className="h-5 w-5" />
                <DialogTitle>¿Deseas anular esta venta?</DialogTitle>
              </div>
              <DialogDescription>
                Esta acción cancelará el comprobante #{selectedReceiptToVoid.id.slice(0, 8).toUpperCase()} por un total de ${selectedReceiptToVoid.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}.
              </DialogDescription>
            </DialogHeader>

            {voidError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
                {voidError}
              </div>
            )}

            <div className="space-y-3 py-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
                <p className="font-semibold">⚠️ Restitución Automática de Stock:</p>
                <p>
                  Las unidades vendidas en este ticket se reintegrarán automáticamente al stock disponible y se generará un movimiento de auditoría correspondiente.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Motivo de anulación (opcional):
                </label>
                <Input
                  placeholder="ej. Error de cobranza, devolución del cliente..."
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedReceiptToVoid(null)}
                disabled={isVoiding}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleConfirmVoid}
                disabled={isVoiding}
              >
                {isVoiding ? 'Anulando...' : 'Confirmar Anulación'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
