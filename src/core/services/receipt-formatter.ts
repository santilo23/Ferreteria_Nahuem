import { Receipt } from '../domain/entities'

export interface ReceiptPrintData {
  receipt: Receipt
  paymentMethod?: string
  amountPaid?: number
  change?: number
  itemsDetail?: Array<{
    name: string
    quantity: number
    unitPrice: number
    subtotal: number
  }>
}

export class ReceiptFormatter {
  static formatThermalTicket(data: ReceiptPrintData): string {
    const { receipt, paymentMethod = 'EFECTIVO', amountPaid, change = 0, itemsDetail } = data
    const divider = '----------------------------------------'
    const doubleDivider = '========================================'

    const dateStr = receipt.date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    const timeStr = receipt.date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    })

    const lines: string[] = [
      doubleDivider,
      '           FERRETERIA NAHUEM            ',
      '    Control de Stock y Venta Local     ',
      '         Tel: (011) 4455-6677           ',
      divider,
      `TICKET NO FISCAL: #${receipt.id.slice(0, 8).toUpperCase()}`,
      `FECHA: ${dateStr}  HORA: ${timeStr}`,
      `CLIENTE: ${receipt.customerName || 'Consumidor Final'}`,
      divider,
      'CANT  DETALLE                 SUBTOTAL',
      divider,
    ]

    if (itemsDetail && itemsDetail.length > 0) {
      for (const item of itemsDetail) {
        const qty = item.quantity.toString().padStart(3, ' ')
        const name = item.name.length > 20 ? item.name.slice(0, 19) + '.' : item.name.padEnd(20, ' ')
        const sub = `$${item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`.padStart(12, ' ')
        lines.push(`${qty}x ${name} ${sub}`)
      }
    } else {
      for (const item of receipt.items) {
        const qty = item.quantity.toString().padStart(3, ' ')
        const sub = `$${item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`.padStart(12, ' ')
        lines.push(`${qty}x Art. ${item.productId.slice(0, 15).padEnd(16, ' ')} ${sub}`)
      }
    }

    lines.push(divider)
    lines.push(`TOTAL A PAGAR:      $${receipt.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`)
    lines.push(`FORMA DE PAGO:      ${paymentMethod.toUpperCase()}`)

    if (amountPaid !== undefined && amountPaid > 0) {
      lines.push(`ABONA CON:          $${amountPaid.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`)
      lines.push(`SU CAMBIO:          $${change.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`)
    }

    lines.push(divider)
    lines.push('        ** COMPROBANTE NO FISCAL **     ')
    lines.push('    DOCUMENTO NO VALIDO COMO FACTURA    ')
    lines.push('   Constancia interna de entrega de     ')
    lines.push('             mercaderia                 ')
    lines.push('       ¡Muchas gracias por su compra!   ')
    lines.push(doubleDivider)

    return lines.join('\n')
  }
}
