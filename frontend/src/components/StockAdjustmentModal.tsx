import React, { useState, useEffect } from 'react';
import { Plus, Minus, Package, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import type { InventoryRecord } from '../types/api';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  inventoryRecord?: InventoryRecord;
}

const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  inventoryRecord,
}) => {
  const [adjustmentType, setAdjustmentType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('IN');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState<'sale' | 'damage' | 'receiving' | 'correction' | 'other'>('receiving');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && inventoryRecord) {
      // Reset form when modal opens
      setAdjustmentType('IN');
      setQuantity('');
      setNotes('');
      setReason('receiving');
      setError(null);
    }
  }, [isOpen, inventoryRecord]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventoryRecord || !quantity) return;

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError('Please enter a valid positive quantity');
      return;
    }

    // For OUT adjustments, check if we have enough stock
    const availableQuantity = inventoryRecord.quantity - inventoryRecord.reserved_quantity;
    if (adjustmentType === 'OUT' && quantityNum > availableQuantity) {
      setError(`Cannot remove ${quantityNum} items. Only ${availableQuantity} available.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.inventory.adjustStock({
        product_id: inventoryRecord.product_id,
        quantity: quantityNum,
        movement_type: adjustmentType,
        notes: notes || undefined,
        reason: reason,
      });

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to adjust stock';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !inventoryRecord) return null;

  const availableQuantity = inventoryRecord.quantity - inventoryRecord.reserved_quantity;
  const productName = inventoryRecord.product?.name || 'Unknown Product';
  const productSku = inventoryRecord.product?.sku || 'N/A';
  const productBarcode = inventoryRecord.product?.barcode;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity">
          <div className="absolute inset-0 bg-muted/500 opacity-75" onClick={onClose}></div>
        </div>

        <div className="inline-block align-bottom bg-card text-card-foreground rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-card text-card-foreground px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                  <h3 className="text-lg leading-6 font-medium text-foreground">
                    Stock Adjustment
                  </h3>
                  <div className="mt-2">
                    <div className="bg-muted/50 rounded-lg p-4 mb-4">
                      <div className="text-sm text-muted-foreground">
                        <div className="font-semibold text-foreground">{productName}</div>
                        <div>SKU: {productSku}</div>
                        {productBarcode && <div>Barcode: {productBarcode}</div>}
                        <div className="mt-2 flex space-x-4">
                          <div>
                            <span className="text-muted-foreground">Current Stock:</span>
                            <span className="ml-1 font-semibold">{inventoryRecord.quantity}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Available:</span>
                            <span className="ml-1 font-semibold">{availableQuantity}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                        <div className="flex">
                          <AlertCircle className="h-5 w-5 text-red-400" />
                          <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Adjustment Type */}
                      <div>
                        <label className="text-sm font-medium text-foreground mb-3 block">
                          Adjustment Type
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustmentType('IN');
                              setReason('receiving');
                            }}
                            className={`flex items-center justify-center px-3 py-2 border rounded-md text-sm font-medium ${
                              adjustmentType === 'IN'
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-input bg-white text-foreground hover:bg-muted/50'
                            }`}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Receive Stock
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustmentType('OUT');
                              setReason('sale');
                            }}
                            className={`flex items-center justify-center px-3 py-2 border rounded-md text-sm font-medium ${
                              adjustmentType === 'OUT'
                                ? 'border-red-500 bg-red-50 text-red-700'
                                : 'border-input bg-white text-foreground hover:bg-muted/50'
                            }`}
                          >
                            <Minus className="w-4 h-4 mr-1" />
                            Remove Stock
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustmentType('ADJUSTMENT');
                              setReason('correction');
                            }}
                            className={`flex items-center justify-center px-3 py-2 border rounded-md text-sm font-medium ${
                              adjustmentType === 'ADJUSTMENT'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-input bg-white text-foreground hover:bg-muted/50'
                            }`}
                          >
                            Correct Count
                          </button>
                        </div>
                      </div>

                      {/* Quantity */}
                      <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-foreground">
                          Quantity
                        </label>
                        <div className="mt-1">
                          <input
                            type="number"
                            id="quantity"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            min="1"
                            max={adjustmentType === 'OUT' ? availableQuantity : undefined}
                            className="shadow-sm focus:ring-2 focus:ring-ring focus:border-transparent block w-full sm:text-sm border-input rounded-md"
                            placeholder="Enter quantity"
                            required
                          />
                        </div>
                        {adjustmentType === 'OUT' && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Maximum available: {availableQuantity}
                          </p>
                        )}
                      </div>

                      {/* Reason */}
                      <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-foreground">
                          Reason
                        </label>
                        <div className="mt-1">
                          <select
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value as typeof reason)}
                            className="shadow-sm focus:ring-2 focus:ring-ring focus:border-transparent block w-full sm:text-sm border-input rounded-md"
                          >
                            <option value="receiving">Receiving new stock</option>
                            <option value="sale">Sale/Customer purchase</option>
                            <option value="damage">Damaged/Defective items</option>
                            <option value="correction">Inventory count correction</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-foreground">
                          Additional Notes (Optional)
                        </label>
                        <div className="mt-1">
                          <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="shadow-sm focus:ring-2 focus:ring-ring focus:border-transparent block w-full sm:text-sm border-input rounded-md"
                            placeholder="Add additional details..."
                          />
                        </div>
                      </div>

                      {/* Preview */}
                      {quantity && !isNaN(parseInt(quantity)) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                          <div className="text-sm text-blue-800">
                            <span className="font-medium">Preview:</span>
                            {adjustmentType === 'IN' && (
                              <div>Stock will increase from {inventoryRecord.quantity} to {inventoryRecord.quantity + parseInt(quantity)}</div>
                            )}
                            {adjustmentType === 'OUT' && (
                              <div>Stock will decrease from {inventoryRecord.quantity} to {inventoryRecord.quantity - parseInt(quantity)}</div>
                            )}
                            {adjustmentType === 'ADJUSTMENT' && (
                              <div>Stock will be adjusted by {parseInt(quantity)} units</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading || !quantity}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Adjust Stock'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-input shadow-sm px-4 py-2 bg-card text-card-foreground text-base font-medium hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StockAdjustmentModal;