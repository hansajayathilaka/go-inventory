import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, Smartphone, Keyboard, AlertCircle, CheckCircle, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { barcodeService } from '@/services/pos/barcodeService';
import type { BarcodeResult, BarcodeScannerConfig, BarcodeProductLookup } from '@/types/pos/barcode';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onBarcodeDetected: (result: BarcodeResult, product?: BarcodeProductLookup) => void;
  config?: Partial<BarcodeScannerConfig>;
}

export function BarcodeScanner({
  isOpen,
  onClose,
  onBarcodeDetected,
  config = {}
}: BarcodeScannerProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<BarcodeResult | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [camerasSupported, setCamerasSupported] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | undefined>(undefined);

  const defaultConfig: BarcodeScannerConfig = {
    enableCamera: true,
    enableManualEntry: true,
    autoClose: true,
    showResult: true,
    timeout: 30000,
    beepOnSuccess: true,
    vibrate: true,
    ...config
  };

  const checkCameraSupport = useCallback(async () => {
    try {
      const supported = await barcodeService.isCameraScanningSupported();
      setCamerasSupported(supported);

      if (supported && defaultConfig.enableCamera) {
        setActiveTab('camera');
      } else {
        setActiveTab('manual');
      }
    } catch {
      console.warn('Failed to check camera support');
      setCamerasSupported(false);
      setActiveTab('manual');
    }
  }, [defaultConfig.enableCamera]);

  useEffect(() => {
    if (isOpen) {
      checkCameraSupport();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen, checkCameraSupport]);

  const requestPermission = async () => {
    try {
      setError(null);
      const granted = await barcodeService.requestCameraPermission();
      setHasPermission(granted);

      if (!granted) {
        setError('Camera permission denied. Please allow camera access to scan barcodes.');
      }

      return granted;
    } catch (err) {
      const errorMessage = 'Failed to request camera permission';
      setError(errorMessage);
      setHasPermission(false);
      return false;
    }
  };

  const startScanning = async () => {
    try {
      setError(null);
      setIsScanning(true);

      // Request permission if not already granted
      if (hasPermission !== true) {
        const granted = await requestPermission();
        if (!granted) {
          setIsScanning(false);
          return;
        }
      }

      // Get video stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Prefer back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Start scanning loop (simplified implementation)
      // In a real implementation, you would use a library like ZXing or QuaggaJS
      startScanningLoop();

    } catch (err) {
      console.error('Failed to start camera:', err);
      setError('Failed to access camera. Please ensure camera permissions are granted.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startScanningLoop = () => {
    // This is a simplified scanning loop
    // In production, integrate with a proper barcode scanning library
    const scanFrame = () => {
      if (!isScanning || !videoRef.current) {
        return;
      }

      // Simulate barcode detection for demo purposes
      // Real implementation would use canvas to capture video frame
      // and process it with a barcode detection library

      animationRef.current = requestAnimationFrame(scanFrame);
    };

    animationRef.current = requestAnimationFrame(scanFrame);
  };

  const handleBarcodeDetected = async (barcodeText: string, confidence = 1.0) => {
    try {
      const validation = barcodeService.validateBarcode(barcodeText);

      if (!validation.isValid) {
        setError(validation.error || 'Invalid barcode detected');
        return;
      }

      const result: BarcodeResult = {
        text: barcodeText,
        format: validation.format!,
        timestamp: new Date(),
        confidence
      };

      setLastResult(result);
      setIsLookingUp(true);

      // Look up product
      const productLookup = await barcodeService.lookupProduct(barcodeText);

      setIsLookingUp(false);

      // Provide feedback
      if (defaultConfig.beepOnSuccess) {
        // Play success sound (if supported)
        try {
          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const audioContext = new AudioContextClass();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.value = 800;
          oscillator.type = 'square';
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.1);
        } catch {
          // Ignore audio errors
        }
      }

      if (defaultConfig.vibrate && navigator.vibrate) {
        navigator.vibrate(100);
      }

      // Call the callback
      onBarcodeDetected(result, productLookup);

      // Auto-close if configured
      if (defaultConfig.autoClose) {
        setTimeout(() => {
          onClose();
        }, 1000);
      }

    } catch (err) {
      console.error('Error processing barcode:', err);
      setError('Failed to process barcode');
      setIsLookingUp(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualInput.trim()) {
      setError('Please enter a barcode');
      return;
    }

    await handleBarcodeDetected(manualInput.trim());
  };

  const handleManualInputChange = (value: string) => {
    setManualInput(value);
    setError(null);

    // Validate as user types
    if (value.length >= 8) {
      const validation = barcodeService.validateManualEntry(value);
      if (!validation.isValid && validation.error) {
        setError(validation.error);
      }
    }
  };

  const simulateBarcodeDetection = (barcode: string) => {
    handleBarcodeDetected(barcode);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Scan className="h-5 w-5" />
            <span>Barcode Scanner</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'camera' | 'manual')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="camera" disabled={!camerasSupported}>
              <Camera className="h-4 w-4 mr-2" />
              Camera
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Keyboard className="h-4 w-4 mr-2" />
              Manual Entry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="camera" className="space-y-4">
            {camerasSupported ? (
              <div className="space-y-4">
                {/* Camera Preview */}
                <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />

                  {/* Scanning Overlay */}
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="border-2 border-primary w-64 h-32 bg-transparent relative">
                        <div className="absolute inset-x-0 top-1/2 h-0.5 bg-primary animate-pulse" />
                        <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-primary" />
                        <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-primary" />
                        <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-primary" />
                        <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-primary" />
                      </div>
                    </div>
                  )}

                  {/* Status Overlays */}
                  {!isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-white text-center">
                        <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Camera not active</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Camera Controls */}
                <div className="flex justify-center space-x-2">
                  {!isScanning ? (
                    <Button onClick={startScanning} className="flex items-center space-x-2">
                      <Camera className="h-4 w-4" />
                      <span>Start Scanning</span>
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={stopScanning}>
                      <X className="h-4 w-4" />
                      <span>Stop Scanning</span>
                    </Button>
                  )}
                </div>

                {/* Permission Status */}
                {hasPermission === false && (
                  <Card className="p-3 border-orange-200 bg-orange-50">
                    <div className="flex items-center space-x-2 text-orange-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Camera permission required for scanning</span>
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <Smartphone className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Camera not supported</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Camera scanning is not available on this device. Please use manual entry.
                </p>
                <Button onClick={() => setActiveTab('manual')}>
                  Switch to Manual Entry
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Enter Barcode</label>
                <Input
                  type="text"
                  placeholder="Scan or type barcode number..."
                  value={manualInput}
                  onChange={(e) => handleManualInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleManualSubmit();
                    }
                  }}
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleManualSubmit}
                disabled={!manualInput.trim() || isLookingUp}
                className="w-full"
              >
                {isLookingUp ? 'Looking up...' : 'Lookup Product'}
              </Button>
            </div>

            {/* Sample Barcodes for Testing */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Sample Barcodes (for testing):</h4>
              <div className="grid grid-cols-1 gap-2">
                {barcodeService.generateSampleBarcodes().map((sample, index) => (
                  <Card key={index} className="p-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <code className="text-sm font-mono">{sample.barcode}</code>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {sample.format}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {sample.description}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => simulateBarcodeDetection(sample.barcode)}
                      >
                        Test
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Error Display */}
        {error && (
          <Card className="p-3 border-red-200 bg-red-50">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </Card>
        )}

        {/* Last Result Display */}
        {lastResult && defaultConfig.showResult && (
          <Card className="p-3 border-green-200 bg-green-50">
            <div className="flex items-center space-x-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <div className="flex-1">
                <div className="text-sm font-medium">
                  Barcode Detected: {barcodeService.formatBarcodeForDisplay(lastResult.text, lastResult.format)}
                </div>
                <div className="text-xs">
                  Format: {lastResult.format} • Confidence: {Math.round((lastResult.confidence || 1) * 100)}%
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {isLookingUp && (
          <Card className="p-3 border-blue-200 bg-blue-50">
            <div className="flex items-center space-x-2 text-blue-800">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
              <span className="text-sm">Looking up product...</span>
            </div>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}