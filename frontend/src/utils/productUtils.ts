// Utility functions to help with Product interface migration
// These functions provide backward compatibility for components using the old interface

import type { Product } from '@/types/inventory';

// Get stock quantity from inventory array
export function getStockQuantity(product: Product): number {
  return product.inventory?.[0]?.quantity ?? product.total_stock ?? 0;
}

// Get reorder level (min stock level) from inventory array
export function getReorderLevel(product: Product): number {
  return product.inventory?.[0]?.reorder_level ?? 0;
}

// Get reserved quantity from inventory array
export function getReservedQuantity(product: Product): number {
  return product.inventory?.[0]?.reserved_quantity ?? 0;
}

// Get available quantity (stock - reserved)
export function getAvailableQuantity(product: Product): number {
  const stock = getStockQuantity(product);
  const reserved = getReservedQuantity(product);
  return Math.max(0, stock - reserved);
}

// Check if product is low stock
export function isLowStock(product: Product): boolean {
  const stock = getStockQuantity(product);
  const reorderLevel = getReorderLevel(product);
  return stock <= reorderLevel;
}

// Check if product is out of stock
export function isOutOfStock(product: Product): boolean {
  return getStockQuantity(product) === 0;
}

// Get the display price (retail price for backward compatibility)
export function getDisplayPrice(product: Product): number {
  return product.retail_price;
}

// Get a unit name (backward compatibility - return 'pcs' as default)
export function getUnit(_product: Product): string {
  // Since the new Product interface doesn't have a unit field,
  // return a default unit for backward compatibility
  return 'pcs';
}

// Check if product has valid inventory data
export function hasInventoryData(product: Product): boolean {
  return !!(product.inventory && product.inventory.length > 0);
}

// Get inventory record ID for API calls
export function getInventoryId(product: Product): string | undefined {
  return product.inventory?.[0]?.id;
}