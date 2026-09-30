import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/presentation/components/ui/dialog'
import { Button } from '@/presentation/components/ui/button'
import { Printer, Copy, Check, CheckCircle2, FileDown } from 'lucide-react'
import { ProcessSaleResult } from '@/core/use-cases'
import { Product } from '@/core/domain/entities'
import { PrintService } from '@/presentation/lib/print-service'

interface ReceiptDialogProps {
  saleResult: ProcessSaleResult | null
  products?: Product[]
  open: boolean
  onClose: () => void
}

export function ReceiptDialog({ saleResult, products, open, onClose }: ReceiptDialogProps) {
  const [copied, setCopied] = useState(false)

  if (!saleResult) return null

  const { receipt, ticketText, change } = saleResult

  const handlePrint = () => {
    const el = document.getElementById('printable-receipt')
    if (el) {
      PrintService.printHtml(el.innerHTML, `Ticket #${receipt.id.slice(0, 8).toUpperCase()}`)
    } else {
      window.print()
    }
  }

  const handleDownload = () => {
    PrintService.downloadTicketFile(
      `ticket_${receipt.id.slice(0, 8).toLowerCase()}.txt`,
      ticketText
    )
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(ticketText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto print:p-0 print:border-none print:shadow-none">
        <DialogHeader className="print:hidden">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <CheckCircle2 className="h-5 w-5" />
            <DialogTitle className="text-lg">¡Venta Registrada Exitosamente!</DialogTitle>
          </div>
          <DialogDescription>
            Ticket no fiscal #{receipt.id.slice(0, 8).toUpperCase()} &bull; Stock actualizado en tiempo real.
          </DialogDescription>
        </DialogHeader>

        {/* Printable Ticket Card (80mm / 58mm style) */}
        <div id="printable-receipt" className="bg-slate-50 border border-slate-200 rounded-lg p-5 my-2 print:border-none print:bg-white print:p-0">
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <h4 className="font-bold text-base tracking-wider uppercase text-slate-900">Ferretería Nahuem</h4>
            <p className="text-xs text-slate-500 font-mono">Control de Stock y Venta Local</p>
            <p className="text-xs text-slate-400 font-mono">Tel: (011) 4455-6677</p>
          </div>

          <div className="py-2.5 border-b border-dashed border-slate-300 text-xs font-mono space-y-1 text-slate-700">
            <div className="flex justify-between">
              <span>TICKET:</span>
              <span className="font-bold">#{receipt.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span>FECHA:</span>
              <span>{new Date(receipt.date).toLocaleDateString('es-AR')} {new Date(receipt.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex justify-between">
              <span>CLIENTE:</span>
              <span className="font-semibold">{receipt.customerName || 'Consumidor Final'}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-3 border-b border-dashed border-slate-300 text-xs font-mono">
            <div className="flex justify-between font-bold text-slate-500 pb-1 mb-1 border-b border-slate-200">
              <span>CANT  DESCRIPCIÓN</span>
              <span>SUBTOTAL</span>
            </div>
            <div className="space-y-1.5">
              {receipt.items.map((item) => {
                const prod = products?.find((p) => p.id === item.productId)
                const displayName = prod ? prod.name : `Art. #${item.productId.slice(0, 8)}`
                return (
                  <div key={item.id} className="flex justify-between items-center text-slate-800">
                    <div className="truncate max-w-[200px]" title={displayName}>
                      <span className="font-bold mr-1">{item.quantity}x</span>
                      <span>{displayName}</span>
                    </div>
                    <span className="font-semibold shrink-0">
                      ${item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Totals & Change */}
          <div className="pt-3 text-xs font-mono space-y-1.5">
            <div className="flex justify-between text-sm font-extrabold text-slate-900">
              <span>TOTAL A PAGAR:</span>
              <span>${receipt.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
            {change > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>VUELTO / CAMBIO:</span>
                <span>${change.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>

          {/* Non-fiscal warning footer */}
          <div className="mt-4 pt-3 border-t border-dashed border-slate-300 text-center text-[10px] font-mono text-slate-500 space-y-0.5">
            <p className="font-bold">** COMPROBANTE NO FISCAL **</p>
            <p>Válido como constancia interna de entrega</p>
            <p>¡Muchas gracias por su compra!</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 print:hidden">
          <div className="flex flex-wrap items-center gap-2 w-full justify-between">
            <div className="flex items-center gap-1.5">
              <Button type="button" variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? '¡Copiado!' : 'Copiar'}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleDownload} className="gap-1.5 text-xs">
                <FileDown className="h-3.5 w-3.5 text-blue-600" />
                Descargar
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" size="sm" onClick={handlePrint} className="gap-1.5 text-xs bg-slate-800 hover:bg-slate-900">
                <Printer className="h-3.5 w-3.5" />
                Imprimir Comprobante
              </Button>
              <Button type="button" variant="default" size="sm" onClick={onClose} className="text-xs">
                Cerrar (Esc)
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
