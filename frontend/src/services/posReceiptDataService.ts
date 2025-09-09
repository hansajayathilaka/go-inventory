import type { ReceiptData } from '@/components/pos/Receipt'
import { format } from 'date-fns'

export interface ReceiptExportFormat {
  format: 'json' | 'csv' | 'txt' | 'xml' | 'pdf'
  includeItems?: boolean
  includePayments?: boolean
  includeCustomer?: boolean
  includeTotals?: boolean
}

export interface ReceiptStorageOptions {
  storageType: 'localStorage' | 'sessionStorage' | 'indexedDB'
  keyPrefix?: string
  maxReceipts?: number
  retentionDays?: number
}

export interface StoredReceipt {
  id: string
  receiptData: ReceiptData
  savedAt: Date
  format?: string
  size?: number
}

class POSReceiptDataService {
  private readonly defaultStorageOptions: Required<ReceiptStorageOptions> = {
    storageType: 'localStorage',
    keyPrefix: 'pos_receipt',
    maxReceipts: 100,
    retentionDays: 30
  }

  /**
   * Format receipt data as JSON
   */
  formatAsJSON(receiptData: ReceiptData, pretty = true): string {
    const formatted = {
      id: receiptData.id,
      billNumber: receiptData.billNumber,
      timestamp: receiptData.saleDate.toISOString(),
      customer: {
        name: receiptData.customerName,
        code: receiptData.customerCode
      },
      cashier: receiptData.cashierName,
      items: receiptData.items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        discount: item.discount || 0
      })),
      totals: {
        subtotal: receiptData.subtotal,
        tax: receiptData.tax,
        taxRate: receiptData.taxRate,
        discount: receiptData.discount,
        total: receiptData.total
      },
      payments: receiptData.payments.map(payment => ({
        method: payment.method,
        amount: payment.amount,
        reference: payment.reference
      })),
      notes: receiptData.notes,
      storeInfo: {
        name: receiptData.storeName,
        address: receiptData.storeAddress,
        phone: receiptData.storePhone
      }
    }

    return pretty ? JSON.stringify(formatted, null, 2) : JSON.stringify(formatted)
  }

  /**
   * Format receipt data as CSV
   */
  formatAsCSV(receiptData: ReceiptData, options: ReceiptExportFormat = { format: 'csv' }): string {
    const lines: string[] = []

    // Header information
    lines.push('Receipt Information')
    lines.push(`Bill Number,${receiptData.billNumber}`)
    lines.push(`Date,${format(receiptData.saleDate, 'yyyy-MM-dd HH:mm:ss')}`)
    lines.push(`Cashier,${receiptData.cashierName}`)
    
    if (options.includeCustomer !== false && receiptData.customerName) {
      lines.push(`Customer,${receiptData.customerName}`)
      if (receiptData.customerCode) {
        lines.push(`Customer Code,${receiptData.customerCode}`)
      }
    }

    lines.push('') // Empty line

    // Items
    if (options.includeItems !== false) {
      lines.push('Items')
      lines.push('Product Name,SKU,Quantity,Unit Price,Total Price,Discount')
      receiptData.items.forEach(item => {
        lines.push([
          `"${item.product.name}"`,
          item.product.sku || '',
          item.quantity,
          item.unitPrice.toFixed(2),
          item.totalPrice.toFixed(2),
          (item.discount || 0).toFixed(2)
        ].join(','))
      })
      lines.push('') // Empty line
    }

    // Totals
    if (options.includeTotals !== false) {
      lines.push('Totals')
      lines.push(`Subtotal,${receiptData.subtotal.toFixed(2)}`)
      if (receiptData.discount > 0) {
        lines.push(`Discount,${receiptData.discount.toFixed(2)}`)
      }
      lines.push(`Tax (${(receiptData.taxRate * 100).toFixed(1)}%),${receiptData.tax.toFixed(2)}`)
      lines.push(`Total,${receiptData.total.toFixed(2)}`)
      lines.push('') // Empty line
    }

    // Payments
    if (options.includePayments !== false) {
      lines.push('Payments')
      lines.push('Method,Amount,Reference')
      receiptData.payments.forEach(payment => {
        lines.push([
          payment.method,
          payment.amount.toFixed(2),
          payment.reference || ''
        ].join(','))
      })
    }

    return lines.join('\n')
  }

  /**
   * Format receipt data as plain text
   */
  formatAsText(receiptData: ReceiptData): string {
    const lines: string[] = []
    const separator = '=' .repeat(40)
    const dashed = '-'.repeat(40)

    // Header
    lines.push(separator)
    lines.push(`${receiptData.storeName || 'Hardware Store Inventory'}`)
    lines.push(`${receiptData.storeAddress || '123 Main Street, City, State 12345'}`)
    lines.push(`${receiptData.storePhone || '(555) 123-4567'}`)
    lines.push(separator)
    lines.push('')

    // Transaction details
    lines.push(`Receipt #: ${receiptData.billNumber}`)
    lines.push(`Date: ${format(receiptData.saleDate, 'MMM dd, yyyy HH:mm')}`)
    lines.push(`Cashier: ${receiptData.cashierName}`)
    if (receiptData.customerName) {
      lines.push(`Customer: ${receiptData.customerName}`)
    }
    if (receiptData.customerCode) {
      lines.push(`Customer Code: ${receiptData.customerCode}`)
    }
    lines.push('')
    lines.push(dashed)

    // Items
    lines.push('ITEMS:')
    receiptData.items.forEach(item => {
      lines.push(`${item.product.name}`)
      if (item.product.sku) {
        lines.push(`  SKU: ${item.product.sku}`)
      }
      lines.push(`  ${item.quantity} x $${item.unitPrice.toFixed(2)} = $${item.totalPrice.toFixed(2)}`)
      if (item.discount && item.discount > 0) {
        lines.push(`  Item Discount: -$${item.discount.toFixed(2)}`)
      }
      lines.push('')
    })

    lines.push(dashed)

    // Totals
    lines.push(`Subtotal: $${receiptData.subtotal.toFixed(2)}`)
    if (receiptData.discount > 0) {
      lines.push(`Discount: -$${receiptData.discount.toFixed(2)}`)
    }
    lines.push(`Tax (${(receiptData.taxRate * 100).toFixed(1)}%): $${receiptData.tax.toFixed(2)}`)
    lines.push(`TOTAL: $${receiptData.total.toFixed(2)}`)
    lines.push('')
    lines.push(dashed)

    // Payments
    lines.push('PAYMENT:')
    receiptData.payments.forEach(payment => {
      const methodLabel = payment.method.charAt(0).toUpperCase() + payment.method.slice(1).replace('_', ' ')
      lines.push(`${methodLabel}: $${payment.amount.toFixed(2)}`)
      if (payment.reference) {
        lines.push(`  Reference: ${payment.reference}`)
      }
    })

    // Calculate change
    const totalPaid = receiptData.payments.reduce((sum, p) => sum + p.amount, 0)
    const change = totalPaid - receiptData.total
    if (change > 0) {
      lines.push(`CHANGE: $${change.toFixed(2)}`)
    }

    lines.push('')
    
    // Notes
    if (receiptData.notes) {
      lines.push('NOTES:')
      lines.push(receiptData.notes)
      lines.push('')
    }

    // Footer
    lines.push(separator)
    lines.push('Thank you for your business!')
    lines.push('Please keep this receipt for your records')
    lines.push(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm:ss')}`)
    lines.push(separator)

    return lines.join('\n')
  }

  /**
   * Format receipt data as XML
   */
  formatAsXML(receiptData: ReceiptData): string {
    const escapeXML = (str: string): string => {
      return str.replace(/[<>&'"]/g, (c) => {
        const map: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          "'": '&apos;',
          '"': '&quot;'
        }
        return map[c] || c
      })
    }

    const items = receiptData.items.map(item => `
    <item>
      <productId>${item.product.id}</productId>
      <productName>${escapeXML(item.product.name)}</productName>
      <sku>${escapeXML(item.product.sku || '')}</sku>
      <quantity>${item.quantity}</quantity>
      <unitPrice>${item.unitPrice.toFixed(2)}</unitPrice>
      <totalPrice>${item.totalPrice.toFixed(2)}</totalPrice>
      <discount>${(item.discount || 0).toFixed(2)}</discount>
    </item>`).join('')

    const payments = receiptData.payments.map(payment => `
    <payment>
      <method>${escapeXML(payment.method)}</method>
      <amount>${payment.amount.toFixed(2)}</amount>
      <reference>${escapeXML(payment.reference || '')}</reference>
    </payment>`).join('')

    return `<?xml version="1.0" encoding="UTF-8"?>
<receipt>
  <id>${receiptData.id || ''}</id>
  <billNumber>${escapeXML(receiptData.billNumber)}</billNumber>
  <saleDate>${receiptData.saleDate.toISOString()}</saleDate>
  <customer>
    <name>${escapeXML(receiptData.customerName || '')}</name>
    <code>${escapeXML(receiptData.customerCode || '')}</code>
  </customer>
  <cashier>${escapeXML(receiptData.cashierName)}</cashier>
  <items>${items}
  </items>
  <totals>
    <subtotal>${receiptData.subtotal.toFixed(2)}</subtotal>
    <tax>${receiptData.tax.toFixed(2)}</tax>
    <taxRate>${receiptData.taxRate.toFixed(4)}</taxRate>
    <discount>${receiptData.discount.toFixed(2)}</discount>
    <total>${receiptData.total.toFixed(2)}</total>
  </totals>
  <payments>${payments}
  </payments>
  <notes>${escapeXML(receiptData.notes || '')}</notes>
  <store>
    <name>${escapeXML(receiptData.storeName || '')}</name>
    <address>${escapeXML(receiptData.storeAddress || '')}</address>
    <phone>${escapeXML(receiptData.storePhone || '')}</phone>
  </store>
</receipt>`
  }

  /**
   * Export receipt in specified format
   */
  exportReceipt(
    receiptData: ReceiptData, 
    format: ReceiptExportFormat['format'] = 'json',
    options: ReceiptExportFormat = { format }
  ): string {
    switch (format) {
      case 'json':
        return this.formatAsJSON(receiptData, true)
      case 'csv':
        return this.formatAsCSV(receiptData, options)
      case 'txt':
        return this.formatAsText(receiptData)
      case 'xml':
        return this.formatAsXML(receiptData)
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  /**
   * Download receipt in specified format
   */
  downloadReceipt(
    receiptData: ReceiptData, 
    format: ReceiptExportFormat['format'] = 'json',
    options: ReceiptExportFormat = { format }
  ): void {
    const content = this.exportReceipt(receiptData, format, options)
    const mimeTypes: Record<string, string> = {
      json: 'application/json',
      csv: 'text/csv',
      txt: 'text/plain',
      xml: 'text/xml'
    }

    const blob = new Blob([content], { type: mimeTypes[format] || 'text/plain' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `receipt_${receiptData.billNumber}.${format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Save receipt to local storage
   */
  saveReceipt(
    receiptData: ReceiptData, 
    options: ReceiptStorageOptions = this.defaultStorageOptions
  ): string {
    const opts = { ...this.defaultStorageOptions, ...options }
    const receiptId = receiptData.id || `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const storageKey = `${opts.keyPrefix}_${receiptId}`

    const storedReceipt: StoredReceipt = {
      id: receiptId,
      receiptData: {
        ...receiptData,
        id: receiptId
      },
      savedAt: new Date(),
      format: 'json',
      size: JSON.stringify(receiptData).length
    }

    try {
      const storage = opts.storageType === 'sessionStorage' ? sessionStorage : localStorage
      storage.setItem(storageKey, JSON.stringify(storedReceipt))
      
      // Clean up old receipts if needed
      this.cleanupOldReceipts(opts)
      
      return receiptId
    } catch (error) {
      console.error('Failed to save receipt:', error)
      throw new Error('Failed to save receipt to storage')
    }
  }

  /**
   * Load receipt from storage
   */
  loadReceipt(receiptId: string, options: ReceiptStorageOptions = this.defaultStorageOptions): StoredReceipt | null {
    const opts = { ...this.defaultStorageOptions, ...options }
    const storageKey = `${opts.keyPrefix}_${receiptId}`

    try {
      const storage = opts.storageType === 'sessionStorage' ? sessionStorage : localStorage
      const stored = storage.getItem(storageKey)
      
      if (!stored) {
        return null
      }

      const storedReceipt: StoredReceipt = JSON.parse(stored)
      
      // Check if receipt has expired
      const savedAt = new Date(storedReceipt.savedAt)
      const expirationDate = new Date(savedAt.getTime() + (opts.retentionDays * 24 * 60 * 60 * 1000))
      
      if (new Date() > expirationDate) {
        storage.removeItem(storageKey)
        return null
      }

      // Convert date strings back to Date objects
      storedReceipt.receiptData.saleDate = new Date(storedReceipt.receiptData.saleDate)
      storedReceipt.savedAt = savedAt

      return storedReceipt
    } catch (error) {
      console.error('Failed to load receipt:', error)
      return null
    }
  }

  /**
   * List all saved receipts
   */
  listSavedReceipts(options: ReceiptStorageOptions = this.defaultStorageOptions): StoredReceipt[] {
    const opts = { ...this.defaultStorageOptions, ...options }
    const storage = opts.storageType === 'sessionStorage' ? sessionStorage : localStorage
    const receipts: StoredReceipt[] = []

    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key && key.startsWith(opts.keyPrefix)) {
        try {
          const stored = storage.getItem(key)
          if (stored) {
            const storedReceipt: StoredReceipt = JSON.parse(stored)
            storedReceipt.receiptData.saleDate = new Date(storedReceipt.receiptData.saleDate)
            storedReceipt.savedAt = new Date(storedReceipt.savedAt)
            receipts.push(storedReceipt)
          }
        } catch (error) {
          console.warn('Failed to parse stored receipt:', key, error)
        }
      }
    }

    return receipts.sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime())
  }

  /**
   * Delete saved receipt
   */
  deleteReceipt(receiptId: string, options: ReceiptStorageOptions = this.defaultStorageOptions): boolean {
    const opts = { ...this.defaultStorageOptions, ...options }
    const storageKey = `${opts.keyPrefix}_${receiptId}`

    try {
      const storage = opts.storageType === 'sessionStorage' ? sessionStorage : localStorage
      storage.removeItem(storageKey)
      return true
    } catch (error) {
      console.error('Failed to delete receipt:', error)
      return false
    }
  }

  /**
   * Clean up old receipts
   */
  private cleanupOldReceipts(options: Required<ReceiptStorageOptions>): void {
    const storage = options.storageType === 'sessionStorage' ? sessionStorage : localStorage
    const keysToDelete: string[] = []

    // Find expired receipts
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key && key.startsWith(options.keyPrefix)) {
        try {
          const stored = storage.getItem(key)
          if (stored) {
            const storedReceipt: StoredReceipt = JSON.parse(stored)
            const savedAt = new Date(storedReceipt.savedAt)
            const expirationDate = new Date(savedAt.getTime() + (options.retentionDays * 24 * 60 * 60 * 1000))
            
            if (new Date() > expirationDate) {
              keysToDelete.push(key)
            }
          }
        } catch (error) {
          // Invalid data, mark for deletion
          keysToDelete.push(key)
        }
      }
    }

    // Delete expired receipts
    keysToDelete.forEach(key => storage.removeItem(key))

    // Check if we need to delete oldest receipts to stay under limit
    const receipts = this.listSavedReceipts(options)
    if (receipts.length > options.maxReceipts) {
      const toDelete = receipts.slice(options.maxReceipts)
      toDelete.forEach(receipt => {
        const storageKey = `${options.keyPrefix}_${receipt.id}`
        storage.removeItem(storageKey)
      })
    }
  }

  /**
   * Get storage usage statistics
   */
  getStorageStats(options: ReceiptStorageOptions = this.defaultStorageOptions): {
    totalReceipts: number
    totalSize: number
    oldestReceipt?: Date
    newestReceipt?: Date
  } {
    const receipts = this.listSavedReceipts(options)
    
    return {
      totalReceipts: receipts.length,
      totalSize: receipts.reduce((sum, receipt) => sum + (receipt.size || 0), 0),
      oldestReceipt: receipts.length > 0 ? receipts[receipts.length - 1].savedAt : undefined,
      newestReceipt: receipts.length > 0 ? receipts[0].savedAt : undefined
    }
  }
}

// Export singleton instance
export const posReceiptDataService = new POSReceiptDataService()

// Export class for testing
export { POSReceiptDataService }