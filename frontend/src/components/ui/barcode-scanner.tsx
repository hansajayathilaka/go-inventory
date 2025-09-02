import { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Camera, CameraOff, AlertCircle, CheckCircle } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onError?: (error: string) => void
  className?: string
}

export function BarcodeScanner({ onScan, onError, className }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const [codeReader] = useState(() => new BrowserMultiFormatReader())
  const streamRef = useRef<MediaStream | null>(null)

  const stopScanning = useCallback(() => {
    try {
      // Stop video stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      
      // Clear video element
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    } catch (err) {
      console.error('Error stopping scanner:', err)
    }
    setIsScanning(false)
  }, [])

  const startScanning = useCallback(async () => {
    if (!videoRef.current) return

    try {
      setError(null)
      setIsScanning(true)

      // Get camera stream first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Try to use back camera on mobile
        } 
      })
      
      streamRef.current = stream
      videoRef.current.srcObject = stream

      // Start decoding from the video element
      codeReader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, error) => {
          if (result) {
            const barcode = result.getText()
            setLastScanned(barcode)
            onScan(barcode)
            
            // Stop scanning after successful scan
            stopScanning()
          }
          
          // Only log actual errors, not "no barcode found" errors
          if (error && error.name !== 'NotFoundException') {
            console.error('Barcode scanning error:', error)
          }
        }
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start camera'
      setError(errorMessage)
      onError?.(errorMessage)
      setIsScanning(false)
    }
  }, [codeReader, onScan, onError, stopScanning])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [stopScanning])

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Camera Preview */}
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            
            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                <div className="text-center">
                  <Camera className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click start to begin scanning
                  </p>
                </div>
              </div>
            )}

            {/* Scanning Overlay */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-4 border-2 border-primary rounded-lg">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/50 text-white px-3 py-1 rounded text-sm">
                    Scanning for barcode...
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <Button
              onClick={isScanning ? stopScanning : startScanning}
              variant={isScanning ? "destructive" : "default"}
              className="flex-1"
            >
              {isScanning ? (
                <>
                  <CameraOff className="h-4 w-4 mr-2" />
                  Stop Scanning
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Start Scanning
                </>
              )}
            </Button>
          </div>

          {/* Status Messages */}
          {error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {lastScanned && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Scanned:</strong> {lastScanned}
              </AlertDescription>
            </Alert>
          )}

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Position the barcode within the camera view</p>
            <p>• Ensure good lighting for accurate scanning</p>
            <p>• Hold steady until the barcode is detected</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}