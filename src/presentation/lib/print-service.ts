export class PrintService {
  /**
   * Prints the given HTML content in an isolated, dedicated hidden iframe.
   * This guarantees:
   * - No parent transform / translate interference
   * - No visibility: hidden clipping from modal overlays
   * - Clean @page styling optimized for 80mm/58mm thermal or standard A4 PDF
   * - Crisp black & white typography and borders
   */
  static printHtml(htmlContent: string, title = 'Comprobante'): void {
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (!doc) return

    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 4mm;
            }
            body {
              font-family: 'Courier New', Courier, monospace, sans-serif;
              font-size: 12px;
              color: black;
              background: white;
              margin: 0;
              padding: 4px;
              width: 72mm;
            }
            * {
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `)
    doc.close()

    try {
      iframe.contentWindow?.focus()
      setTimeout(() => {
        iframe.contentWindow?.print()
        setTimeout(() => {
          if (iframe.parentNode) {
            document.body.removeChild(iframe)
          }
        }, 1500)
      }, 250)
    } catch {
      window.print()
    }
  }

  /**
   * Directly downloads the receipt as a clean text file.
   */
  static downloadTicketFile(filename: string, content: string): void {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}
