import { useState, useRef } from 'react'
import { Product, Supplier, StockMovement, Receipt } from '@/core/domain/entities'
import { BackupService, BackupPayload } from '@/core/services'
import { PrintService } from '@/presentation/lib/print-service'
import { Button } from '@/presentation/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/presentation/components/ui/dialog'
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Database,
  ShieldCheck,
} from 'lucide-react'

interface BackupDialogProps {
  open: boolean
  onClose: () => void
  products: Product[]
  suppliers: Supplier[]
  movements: StockMovement[]
  receipts: Receipt[]
  onRestoreBackup: (data: BackupPayload) => void
}

export function BackupDialog({
  open,
  onClose,
  products,
  suppliers,
  movements,
  receipts,
  onRestoreBackup,
}: BackupDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)

  const handleDownloadJsonBackup = () => {
    try {
      const json = BackupService.exportToJson({ products, suppliers, movements, receipts })
      const dateStr = new Date().toISOString().slice(0, 10)
      PrintService.downloadTicketFile(`backup_nahuem_${dateStr}.json`, json)
      setFeedback({
        type: 'success',
        message: 'Copia de seguridad completa descargada exitosamente en formato JSON.',
      })
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error al generar la copia de seguridad' })
    }
  }

  const handleExportProductsCsv = () => {
    try {
      const csv = BackupService.exportProductsToCsv(products)
      const dateStr = new Date().toISOString().slice(0, 10)
      PrintService.downloadTicketFile(`inventario_nahuem_${dateStr}.csv`, csv)
      setFeedback({ type: 'success', message: 'Inventario exportado a CSV para Excel.' })
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message })
    }
  }

  const handleExportSalesCsv = () => {
    try {
      const csv = BackupService.exportSalesToCsv(receipts)
      const dateStr = new Date().toISOString().slice(0, 10)
      PrintService.downloadTicketFile(`ventas_nahuem_${dateStr}.csv`, csv)
      setFeedback({ type: 'success', message: 'Historial de ventas exportado a CSV para Excel.' })
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsRestoring(true)
    setFeedback(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const parsed = BackupService.importFromJson(content)
        onRestoreBackup(parsed)
        setFeedback({
          type: 'success',
          message: `¡Restauración exitosa! Se cargaron ${parsed.products.length} productos, ${parsed.receipts.length} ventas y ${parsed.suppliers.length} proveedores.`,
        })
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: err.message || 'El archivo seleccionado no es válido o está dañado.',
        })
      } finally {
        setIsRestoring(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }

    reader.onerror = () => {
      setFeedback({ type: 'error', message: 'Error al leer el archivo seleccionado.' })
      setIsRestoring(false)
    }

    reader.readAsText(file)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Database className="h-5 w-5" />
            <DialogTitle>Copias de Seguridad y Respaldo</DialogTitle>
          </div>
          <DialogDescription>
            Descarga respaldos completos de tus datos o restáuralos si cambias de equipo o reinstalas el sistema.
          </DialogDescription>
        </DialogHeader>

        {feedback && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="space-y-4 py-2">
          {/* Card 1: Full Backup Download */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-900">Respaldo Total del Sistema</h4>
                  <p className="text-xs text-slate-500">
                    Guarda todo: {products.length} productos, {receipts.length} ventas, {suppliers.length} proveedores y movimientos.
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleDownloadJsonBackup}
              className="w-full gap-2 text-xs bg-blue-600 hover:bg-blue-700 font-semibold"
            >
              <Download className="h-4 w-4" />
              Descargar Respaldo Completo (JSON)
            </Button>
          </div>

          {/* Card 2: Excel CSV Exports */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-900">Exportar a Planillas Excel (CSV)</h4>
                <p className="text-xs text-slate-500">Descarga tablas formateadas para contabilidad y análisis.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportProductsCsv}
                className="gap-2 text-xs border-slate-300"
              >
                <Download className="h-3.5 w-3.5 text-emerald-600" />
                Catálogo Inventario (.csv)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportSalesCsv}
                className="gap-2 text-xs border-slate-300"
              >
                <Download className="h-3.5 w-3.5 text-emerald-600" />
                Historial de Ventas (.csv)
              </Button>
            </div>
          </div>

          {/* Card 3: Restore Data */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-900">Restaurar Copia de Seguridad</h4>
                <p className="text-xs text-slate-500">
                  Sube un archivo previo (<code className="text-amber-700">.json</code>) para recuperar tus datos.
                </p>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            <Button
              type="button"
              variant="outline"
              disabled={isRestoring}
              onClick={() => fileInputRef.current?.click()}
              className="w-full gap-2 text-xs border-dashed border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50/50"
            >
              <Upload className="h-4 w-4 text-blue-600" />
              {isRestoring ? 'Procesando archivo...' : 'Seleccionar Archivo de Respaldo (.json)'}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="default" size="sm" onClick={onClose} className="text-xs">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
