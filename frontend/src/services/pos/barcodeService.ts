import type {
  BarcodeFormat,
  BarcodeValidationResult,
  BarcodeProductLookup,
  ManualBarcodeEntry
} from '@/types/pos/barcode';
import { productService } from '@/services/productService';

class BarcodeService {
  private static instance: BarcodeService;

  public static getInstance(): BarcodeService {
    if (!BarcodeService.instance) {
      BarcodeService.instance = new BarcodeService();
    }
    return BarcodeService.instance;
  }

  /**
   * Validate a barcode string and detect its format
   */
  validateBarcode(barcode: string): BarcodeValidationResult {
    if (!barcode || typeof barcode !== 'string') {
      return { isValid: false, format: null, error: 'Invalid barcode format' };
    }

    const cleaned = barcode.trim().replace(/\s+/g, '');

    // UPC-A (12 digits)
    if (/^\d{12}$/.test(cleaned)) {
      return { isValid: this.validateUPCA(cleaned), format: 'UPC_A' };
    }

    // EAN-13 (13 digits)
    if (/^\d{13}$/.test(cleaned)) {
      return { isValid: this.validateEAN13(cleaned), format: 'EAN_13' };
    }

    // UPC-E (8 digits)
    if (/^\d{8}$/.test(cleaned)) {
      return { isValid: true, format: 'UPC_E' };
    }

    // EAN-8 (8 digits, but different from UPC-E)
    if (/^\d{8}$/.test(cleaned)) {
      return { isValid: this.validateEAN8(cleaned), format: 'EAN_8' };
    }

    // Code 128 (variable length alphanumeric)
    if (/^[A-Za-z0-9\s\-_.]+$/.test(cleaned) && cleaned.length >= 6) {
      return { isValid: true, format: 'CODE_128' };
    }

    // Code 39 (variable length, specific character set)
    if (/^[A-Z0-9\s\-_.$/+%*]+$/.test(cleaned.toUpperCase()) && cleaned.length >= 6) {
      return { isValid: true, format: 'CODE_39' };
    }

    return { isValid: false, format: null, error: 'Unrecognized barcode format' };
  }

  /**
   * Validate UPC-A checksum
   */
  private validateUPCA(barcode: string): boolean {
    if (barcode.length !== 12) return false;

    let sum = 0;
    for (let i = 0; i < 11; i++) {
      const digit = parseInt(barcode[i]);
      sum += i % 2 === 0 ? digit : digit * 3;
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(barcode[11]);
  }

  /**
   * Validate EAN-13 checksum
   */
  private validateEAN13(barcode: string): boolean {
    if (barcode.length !== 13) return false;

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(barcode[i]);
      sum += i % 2 === 0 ? digit : digit * 3;
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(barcode[12]);
  }

  /**
   * Validate EAN-8 checksum
   */
  private validateEAN8(barcode: string): boolean {
    if (barcode.length !== 8) return false;

    let sum = 0;
    for (let i = 0; i < 7; i++) {
      const digit = parseInt(barcode[i]);
      sum += i % 2 === 0 ? digit * 3 : digit;
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(barcode[7]);
  }

  /**
   * Validate manual barcode entry
   */
  validateManualEntry(value: string): ManualBarcodeEntry {
    const validation = this.validateBarcode(value);

    return {
      value: value.trim(),
      isValid: validation.isValid,
      detectedFormat: validation.format || undefined,
      error: validation.error
    };
  }

  /**
   * Look up product by barcode
   */
  async lookupProduct(barcode: string): Promise<BarcodeProductLookup> {
    try {
      const validation = this.validateBarcode(barcode);

      if (!validation.isValid) {
        return {
          barcode,
          found: false,
          error: validation.error || 'Invalid barcode format'
        };
      }

      // Try to find product by barcode
      const products = await productService.searchProducts({
        search: barcode,
        limit: 1
      });

      // Check if any product matches the barcode exactly
      const product = products.products.find(p =>
        p.barcode === barcode ||
        p.sku === barcode ||
        p.id === barcode
      );

      if (product) {
        return {
          barcode,
          found: true,
          productId: product.id,
          productName: product.name,
          price: product.retail_price || product.price || 0
        };
      }

      return {
        barcode,
        found: false,
        error: 'Product not found'
      };

    } catch (error) {
      console.error('Barcode lookup error:', error);
      return {
        barcode,
        found: false,
        error: 'Failed to lookup product'
      };
    }
  }

  /**
   * Format barcode for display
   */
  formatBarcodeForDisplay(barcode: string, format?: BarcodeFormat): string {
    if (!format) {
      const validation = this.validateBarcode(barcode);
      format = validation.format || undefined;
    }

    switch (format) {
      case 'UPC_A':
        // Format: 0 12345 67890 1
        return barcode.replace(/(\d{1})(\d{5})(\d{5})(\d{1})/, '$1 $2 $3 $4');

      case 'EAN_13':
        // Format: 123 4567 890123
        return barcode.replace(/(\d{3})(\d{4})(\d{6})/, '$1 $2 $3');

      case 'UPC_E':
      case 'EAN_8':
        // Format: 1234 5678
        return barcode.replace(/(\d{4})(\d{4})/, '$1 $2');

      default:
        return barcode;
    }
  }

  /**
   * Get supported barcode formats
   */
  getSupportedFormats(): BarcodeFormat[] {
    return [
      'UPC_A',
      'UPC_E',
      'EAN_13',
      'EAN_8',
      'CODE_128',
      'CODE_39',
      'CODE_93',
      'CODABAR'
    ];
  }

  /**
   * Check if device supports camera scanning
   */
  async isCameraScanningSupported(): Promise<boolean> {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return false;
      }

      // Check if we can enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'videoinput');
    } catch (error) {
      console.warn('Camera scanning support check failed:', error);
      return false;
    }
  }

  /**
   * Request camera permission
   */
  async requestCameraPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      // Stop the stream immediately, we just wanted to check permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.warn('Camera permission denied:', error);
      return false;
    }
  }

  /**
   * Get available camera devices
   */
  async getCameraDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.warn('Failed to get camera devices:', error);
      return [];
    }
  }

  /**
   * Generate sample barcodes for testing
   */
  generateSampleBarcodes(): Array<{ barcode: string; format: BarcodeFormat; description: string }> {
    return [
      { barcode: '012345678905', format: 'UPC_A', description: 'Sample UPC-A Product' },
      { barcode: '1234567890128', format: 'EAN_13', description: 'Sample EAN-13 Product' },
      { barcode: '12345670', format: 'EAN_8', description: 'Sample EAN-8 Product' },
      { barcode: 'TEST12345', format: 'CODE_128', description: 'Sample Code 128 Product' },
      { barcode: 'SAMPLE*123', format: 'CODE_39', description: 'Sample Code 39 Product' }
    ];
  }
}

export const barcodeService = BarcodeService.getInstance();