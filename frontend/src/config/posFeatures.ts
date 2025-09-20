/**
 * POS Feature Configuration
 *
 * Central configuration file for enabling/disabling POS system features.
 * This allows for easy feature toggling during development and deployment.
 */

export interface POSFeatureConfig {
  /** Enable/disable the advanced discount calculation engine */
  discountEngine: boolean;

  /** Enable/disable barcode scanning functionality */
  barcodeScanning: boolean;

  /** Enable/disable multi-session support */
  multiSession: boolean;

  /** Enable/disable customer management integration */
  customerManagement: boolean;

  /** Enable/disable inventory integration */
  inventoryIntegration: boolean;

  /** Enable/disable receipt printing */
  receiptPrinting: boolean;

  /** Enable/disable payment processing */
  paymentProcessing: boolean;
}

/**
 * Default POS feature configuration
 *
 * Features are disabled by default for gradual rollout and testing.
 * Enable features as they become stable and ready for production use.
 */
export const DEFAULT_POS_FEATURES: POSFeatureConfig = {
  // Advanced Features (Disabled by default)
  discountEngine: false,           // Advanced discount calculation engine
  receiptPrinting: false,          // Receipt generation and printing
  paymentProcessing: false,        // Payment method processing
  customerManagement: false,       // Customer selection and management

  // Core Features (Enabled by default)
  barcodeScanning: true,           // Barcode scanning support
  multiSession: true,              // Multi-session cart management
  inventoryIntegration: true,      // Real-time inventory checking
};

/**
 * Get current POS feature configuration
 *
 * This function can be extended to read from environment variables,
 * local storage, or remote configuration in the future.
 */
export function getPOSFeatureConfig(): POSFeatureConfig {
  // For now, return default configuration
  // Future: Read from environment variables or API
  return DEFAULT_POS_FEATURES;
}

/**
 * Check if a specific POS feature is enabled
 */
export function isPOSFeatureEnabled(feature: keyof POSFeatureConfig): boolean {
  const config = getPOSFeatureConfig();
  return config[feature];
}

/**
 * Development helper: Override feature configuration
 *
 * This can be used in development to temporarily enable/disable features
 * without modifying the default configuration.
 */
export function overridePOSFeatures(overrides: Partial<POSFeatureConfig>): POSFeatureConfig {
  return {
    ...DEFAULT_POS_FEATURES,
    ...overrides
  };
}