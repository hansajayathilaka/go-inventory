import { useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { BarcodeScanner } from './barcode-scanner'
import { Scan } from 'lucide-react'

interface BarcodeInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function BarcodeInput({ value, onChange, placeholder, className, disabled }: BarcodeInputProps) {
  const [showScanner, setShowScanner] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleScan = (barcode: string) => {
    onChange(barcode)
    setShowScanner(false)
    // Focus back to input for further editing if needed
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  return (
    <div className="flex gap-2">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
      />
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled}
            title="Scan barcode"
          >
            <Scan className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Barcode</DialogTitle>
          </DialogHeader>
          <BarcodeScanner
            onScan={handleScan}
            onError={(error) => {
              console.error('Barcode scanning error:', error)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}