// Barcode Scanner Types
export type BarcodeFormat =
  | 'UPC_A'
  | 'UPC_E'
  | 'EAN_13'
  | 'EAN_8'
  | 'CODE_128'
  | 'CODE_39'
  | 'CODE_93'
  | 'CODABAR'
  | 'ITF'
  | 'RSS_14'
  | 'RSS_EXPANDED'
  | 'QR_CODE'
  | 'DATA_MATRIX'
  | 'PDF_417';

export interface BarcodeResult {
  text: string;
  format: BarcodeFormat;
  timestamp: Date;
  confidence?: number;
}

export interface BarcodeScannerConfig {
  formats?: BarcodeFormat[];
  enableCamera?: boolean;
  enableManualEntry?: boolean;
  autoClose?: boolean;
  showResult?: boolean;
  timeout?: number; // in milliseconds
  beepOnSuccess?: boolean;
  vibrate?: boolean;
}

export interface BarcodeScannerState {
  isScanning: boolean;
  hasPermission: boolean | null;
  error: string | null;
  lastResult: BarcodeResult | null;
  cameraDevices: MediaDeviceInfo[];
  selectedCameraId: string | null;
}

export interface BarcodeScannerActions {
  startScanning: () => Promise<void>;
  stopScanning: () => void;
  switchCamera: (deviceId: string) => Promise<void>;
  requestPermission: () => Promise<boolean>;
  clearError: () => void;
  clearResult: () => void;
}

export interface BarcodeValidationResult {
  isValid: boolean;
  format: BarcodeFormat | null;
  error?: string;
}

// Product lookup integration
export interface BarcodeProductLookup {
  barcode: string;
  productId?: string;
  productName?: string;
  price?: number;
  found: boolean;
  error?: string;
}

// Manual entry validation
export interface ManualBarcodeEntry {
  value: string;
  isValid: boolean;
  detectedFormat?: BarcodeFormat;
  error?: string;
}