import { useState, useRef } from 'react'
import type { ReceiptData } from './Receipt'
import { posPrintService, type PrintResult } from '@/services/posPrintService'
import { Button } from '@/components/ui/button'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Printer, 
  Download, 
  Eye, 
  Settings, 
  Check, 
  X, 
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReceiptPreviewProps {
  receiptData: ReceiptData
  className?: string
  onClose?: () => void
  onPrintSuccess?: (result: PrintResult) => void
  onPrintError?: (error: string) => void
}

interface PrintSettings {
  paperWidth: number
  fontSize: number
  showLogo: boolean
  margins: {
    top: number
    bottom: number
    left: number
    right: number
  }
}

const defaultPrintSettings: PrintSettings = {
  paperWidth: 80,
  fontSize: 12,
  showLogo: false,
  margins: {
    top: 10,
    bottom: 10,
    left: 5,
    right: 5
  }
}

export function ReceiptPreview({ 
  receiptData, 
  className, 
  onClose,
  onPrintSuccess,
  onPrintError 
}: ReceiptPreviewProps) {
  const [printSettings, setPrintSettings] = useState<PrintSettings>(defaultPrintSettings)
  const [showSettings, setShowSettings] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [printResult, setPrintResult] = useState<PrintResult | null>(null)
  const previewRef = useRef<HTMLIFrameElement>(null)

  // Generate print preview URL
  const previewUrl = posPrintService.generatePrintPreview(receiptData, {
    paperWidth: printSettings.paperWidth,
    fontSize: printSettings.fontSize,
    showLogo: printSettings.showLogo,
    margins: printSettings.margins
  })

  const handlePrint = async () => {
    setIsPrinting(true)
    setPrintResult(null)

    try {
      const result = await posPrintService.printReceipt(receiptData, {
        paperWidth: printSettings.paperWidth,
        fontSize: printSettings.fontSize,
        showLogo: printSettings.showLogo,
        margins: printSettings.margins
      })

      setPrintResult(result)

      if (result.success) {
        onPrintSuccess?.(result)
      } else {
        onPrintError?.(result.error || 'Print failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setPrintResult({
        success: false,
        error: errorMessage
      })
      onPrintError?.(errorMessage)
    } finally {
      setIsPrinting(false)
    }
  }

  const handleDownload = () => {
    posPrintService.downloadReceiptHTML(receiptData, {
      paperWidth: printSettings.paperWidth,
      fontSize: printSettings.fontSize,
      showLogo: printSettings.showLogo,
      margins: printSettings.margins
    })
  }

  const handlePreviewInNewWindow = () => {
    const newWindow = window.open(previewUrl, '_blank', 'width=400,height=600,scrollbars=yes')
    if (!newWindow) {
      onPrintError?.('Unable to open preview window. Please check popup blockers.')
    }
  }

  const resetSettings = () => {
    setPrintSettings(defaultPrintSettings)
  }

  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg shadow-lg', className)}>
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Receipt Preview
            <Badge variant="outline" className="ml-2">
              {receiptData.billNumber}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Settings Panel */}
      {showSettings && (
        <CardContent className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paper Width (mm)
              </label>
              <select
                value={printSettings.paperWidth}
                onChange={(e) => setPrintSettings(prev => ({
                  ...prev,
                  paperWidth: parseInt(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="58">58mm (Small)</option>
                <option value="80">80mm (Standard)</option>
                <option value="110">110mm (Wide)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Font Size (px)
              </label>
              <select
                value={printSettings.fontSize}
                onChange={(e) => setPrintSettings(prev => ({
                  ...prev,
                  fontSize: parseInt(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="10">10px (Small)</option>
                <option value="12">12px (Normal)</option>
                <option value="14">14px (Large)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Top (px)
              </label>
              <input
                type="number"
                value={printSettings.margins.top}
                onChange={(e) => setPrintSettings(prev => ({
                  ...prev,
                  margins: { ...prev.margins, top: parseInt(e.target.value) || 0 }
                }))}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bottom (px)
              </label>
              <input
                type="number"
                value={printSettings.margins.bottom}
                onChange={(e) => setPrintSettings(prev => ({
                  ...prev,
                  margins: { ...prev.margins, bottom: parseInt(e.target.value) || 0 }
                }))}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Left (px)
              </label>
              <input
                type="number"
                value={printSettings.margins.left}
                onChange={(e) => setPrintSettings(prev => ({
                  ...prev,
                  margins: { ...prev.margins, left: parseInt(e.target.value) || 0 }
                }))}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Right (px)
              </label>
              <input
                type="number"
                value={printSettings.margins.right}
                onChange={(e) => setPrintSettings(prev => ({
                  ...prev,
                  margins: { ...prev.margins, right: parseInt(e.target.value) || 0 }
                }))}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showLogo"
                checked={printSettings.showLogo}
                onChange={(e) => setPrintSettings(prev => ({
                  ...prev,
                  showLogo: e.target.checked
                }))}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="showLogo" className="text-sm font-medium text-gray-700">
                Show Logo (if available)
              </label>
            </div>
            <Button variant="outline" size="sm" onClick={resetSettings}>
              Reset to Default
            </Button>
          </div>
          <Separator className="my-4" />
        </CardContent>
      )}

      <CardContent className="space-y-4">
        {/* Print Result */}
        {printResult && (
          <div className={cn(
            'p-3 rounded-md flex items-center gap-2',
            printResult.success 
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          )}>
            {printResult.success ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
            <span className="text-sm font-medium">
              {printResult.success 
                ? 'Print job sent successfully!' 
                : `Print failed: ${printResult.error}`
              }
            </span>
            {printResult.printJobId && (
              <Badge variant="secondary" className="ml-2 text-xs">
                ID: {printResult.printJobId}
              </Badge>
            )}
          </div>
        )}

        {/* Preview Frame */}
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-3 py-2 border-b border-gray-300">
            <span className="text-sm font-medium text-gray-600">
              Preview ({printSettings.paperWidth}mm × {printSettings.fontSize}px)
            </span>
          </div>
          <div className="h-96 overflow-hidden">
            <iframe
              ref={previewRef}
              src={previewUrl}
              className="w-full h-full border-0"
              title="Receipt Preview"
              sandbox="allow-same-origin"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 justify-end">
          <Button
            variant="outline"
            onClick={handlePreviewInNewWindow}
            size="sm"
          >
            <Eye className="w-4 h-4 mr-2" />
            Open in New Window
          </Button>
          
          <Button
            variant="outline"
            onClick={handleDownload}
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Download HTML
          </Button>

          <Button
            onClick={handlePrint}
            disabled={isPrinting}
            size="sm"
            className="min-w-[100px]"
          >
            {isPrinting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Printer className="w-4 h-4 mr-2" />
            )}
            {isPrinting ? 'Printing...' : 'Print Receipt'}
          </Button>
        </div>

        {/* Information */}
        <div className="text-xs text-gray-500 space-y-1 border-t border-gray-200 pt-3">
          <p>• Preview shows how the receipt will look when printed</p>
          <p>• Adjust settings above to customize the print format</p>
          <p>• Print functionality requires a connected printer or PDF printer</p>
        </div>
      </CardContent>
    </div>
  )
}