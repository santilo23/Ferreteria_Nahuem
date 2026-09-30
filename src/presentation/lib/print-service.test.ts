import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PrintService } from './print-service'

describe('PrintService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should create an isolated iframe and trigger printing on it', () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild')

    PrintService.printHtml('<div>Test Ticket Content</div>', 'Ticket #123')

    expect(appendSpy).toHaveBeenCalled()
    const iframe = appendSpy.mock.calls.find(
      (c) => c[0] instanceof HTMLIFrameElement
    )?.[0] as HTMLIFrameElement

    expect(iframe).toBeDefined()
    expect(iframe.style.position).toBe('fixed')
  })

  it('should trigger browser download for ticket text file', () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild')
    const removeSpy = vi.spyOn(document.body, 'removeChild')

    // Mock URL createObjectURL
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:test-url')
    window.URL.revokeObjectURL = vi.fn()

    PrintService.downloadTicketFile('ticket_123.txt', 'FERRETERIA NAHUEM TICKET')

    expect(appendSpy).toHaveBeenCalled()
    expect(removeSpy).toHaveBeenCalled()
  })
})
