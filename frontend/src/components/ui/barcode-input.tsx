import { useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Barcode scanner functionality will be available in the next update.
            </p>
            <Input
              placeholder="Enter barcode manually"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const target = e.target as HTMLInputElement;
                  if (target.value) {
                    handleScan(target.value);
                  }
                }
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}