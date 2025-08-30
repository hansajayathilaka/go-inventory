import React, { useState, useEffect } from 'react';
import { X, FileText, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import type { 
  PurchaseOrder, 
  Supplier,
  Product
} from '../types/api';
import { api } from '../services/api';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  purchaseOrder?: PurchaseOrder | null;
}

interface PurchaseOrderFormData {
  supplier_id: string;
  order_date: string;
  expected_date: string;
  tax_rate: string;
  shipping_cost: string;
  discount_amount: string;
  currency: string;
  notes: string;
  terms: string;
  reference: string;
}

interface POItemFormData {
  product_id: string;
  quantity: string;
  unit_price: string;
  discount_amount: string;
  notes: string;
}

const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  purchaseOrder,
}) => {
  const [formData, setFormData] = useState<PurchaseOrderFormData>({
    supplier_id: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_date: '',
    tax_rate: '0',
    shipping_cost: '0',
    discount_amount: '0',
    currency: 'USD',
    notes: '',
    terms: '',
    reference: '',
  });

  const [items, setItems] = useState<POItemFormData[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!purchaseOrder;

  // Load suppliers and products when modal opens
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  // Reset form when modal opens/closes or purchase order changes
  useEffect(() => {
    if (isOpen) {
      if (purchaseOrder) {
        setFormData({
          supplier_id: purchaseOrder.supplier_id || '',
          order_date: purchaseOrder.order_date?.split('T')[0] || new Date().toISOString().split('T')[0],
          expected_date: purchaseOrder.expected_date?.split('T')[0] || '',
          tax_rate: purchaseOrder.tax_rate?.toString() || '0',
          shipping_cost: purchaseOrder.shipping_cost?.toString() || '0',
          discount_amount: purchaseOrder.discount_amount?.toString() || '0',
          currency: purchaseOrder.currency || 'USD',
          notes: purchaseOrder.notes || '',
          terms: purchaseOrder.terms || '',
          reference: purchaseOrder.reference || '',
        });
        
        // Load existing items
        if (purchaseOrder.items) {
          setItems(purchaseOrder.items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity.toString(),
            unit_price: item.unit_price.toString(),
            discount_amount: item.discount_amount?.toString() || '0',
            notes: item.notes || '',
          })));
        }
      } else {
        // Reset for new purchase order
        setFormData({
          supplier_id: '',
          order_date: new Date().toISOString().split('T')[0],
          expected_date: '',
          tax_rate: '0',
          shipping_cost: '0',
          discount_amount: '0',
          currency: 'USD',
          notes: '',
          terms: '',
          reference: '',
        });
        setItems([]);
      }
      setErrors({});
    }
  }, [isOpen, purchaseOrder]);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      
      const [suppliersResponse, productsResponse] = await Promise.all([
        api.suppliers.list({ page: 1, limit: 1000 }),
        api.products.list({ page: 1, limit: 1000 })
      ]);
      
      setSuppliers(suppliersResponse.data.data || []);
      setProducts(productsResponse.data.data || []);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  // Validation
  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'supplier_id':
        return value.trim() ? '' : 'Supplier is required';
      case 'order_date':
        return value.trim() ? '' : 'Order date is required';
      case 'tax_rate':
        if (!value.trim()) return '';
        const taxRate = parseFloat(value);
        return !isNaN(taxRate) && taxRate >= 0 && taxRate <= 100 ? '' : 'Tax rate must be between 0 and 100';
      case 'shipping_cost':
        if (!value.trim()) return '';
        const shippingCost = parseFloat(value);
        return !isNaN(shippingCost) && shippingCost >= 0 ? '' : 'Shipping cost must be a positive number';
      case 'discount_amount':
        if (!value.trim()) return '';
        const discountAmount = parseFloat(value);
        return !isNaN(discountAmount) && discountAmount >= 0 ? '' : 'Discount amount must be a positive number';
      default:
        return '';
    }
  };

  const validateItem = (item: POItemFormData) => {
    const errors: Record<string, string> = {};
    
    if (!item.product_id) errors.product_id = 'Product is required';
    if (!item.quantity || parseFloat(item.quantity) <= 0) errors.quantity = 'Quantity must be greater than 0';
    if (!item.unit_price || parseFloat(item.unit_price) <= 0) errors.unit_price = 'Unit price must be greater than 0';
    
    const discountAmount = parseFloat(item.discount_amount);
    if (item.discount_amount && (isNaN(discountAmount) || discountAmount < 0)) {
      errors.discount_amount = 'Discount amount must be a positive number';
    }
    
    return errors;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Validate field
    const error = validateField(field, value);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  // Item management functions
  const addItem = () => {
    setItems(prev => [...prev, {
      product_id: '',
      quantity: '1',
      unit_price: '0',
      discount_amount: '0',
      notes: '',
    }]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof POItemFormData, value: string) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  // Calculate totals
  const calculateTotals = () => {
    const subTotal = items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      const itemDiscount = parseFloat(item.discount_amount) || 0;
      return sum + (quantity * unitPrice) - itemDiscount;
    }, 0);

    const taxRate = parseFloat(formData.tax_rate) || 0;
    const shippingCost = parseFloat(formData.shipping_cost) || 0;
    const orderDiscount = parseFloat(formData.discount_amount) || 0;
    
    const taxAmount = (subTotal * taxRate) / 100;
    const totalAmount = subTotal + taxAmount + shippingCost - orderDiscount;

    return {
      subTotal,
      taxAmount,
      totalAmount,
      shippingCost,
      orderDiscount,
    };
  };

  const totals = calculateTotals();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const formErrors: Record<string, string> = {};
    
    // Validate main form fields
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field as keyof PurchaseOrderFormData]);
      if (error) formErrors[field] = error;
    });
    
    // Validate items
    if (items.length === 0) {
      formErrors.items = 'At least one item is required';
    } else {
      items.forEach((item, index) => {
        const itemErrors = validateItem(item);
        Object.keys(itemErrors).forEach(field => {
          formErrors[`item_${index}_${field}`] = itemErrors[field];
        });
      });
    }
    
    setErrors(formErrors);
    
    if (Object.keys(formErrors).length > 0) {
      return;
    }

    try {
      setLoading(true);
      
      const requestData = {
        supplier_id: formData.supplier_id,
        order_date: formData.order_date,
        expected_date: formData.expected_date || undefined,
        tax_rate: parseFloat(formData.tax_rate),
        shipping_cost: parseFloat(formData.shipping_cost),
        discount_amount: parseFloat(formData.discount_amount),
        currency: formData.currency,
        notes: formData.notes || undefined,
        terms: formData.terms || undefined,
        reference: formData.reference || undefined,
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price),
          discount_amount: parseFloat(item.discount_amount),
          notes: item.notes || undefined,
        })),
      };

      if (isEditing && purchaseOrder) {
        const updateData = { ...requestData };
        delete (updateData as any).items; // Items are managed separately in edit mode
        await api.purchaseOrders.update(purchaseOrder.id, updateData);
      } else {
        await api.purchaseOrders.create(requestData);
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving purchase order:', error);
      setErrors({
        general: error.response?.data?.message || 'An error occurred while saving the purchase order'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit Purchase Order' : 'New Purchase Order'}
              </h2>
              {isEditing && purchaseOrder && (
                <p className="text-sm text-gray-500">PO Number: {purchaseOrder.po_number}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-180px)]">
          <form onSubmit={handleSubmit} className="p-6">
            {loadingData ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                <span>Loading data...</span>
              </div>
            ) : (
              <div className="space-y-8">
                {/* General Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">General Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="supplier_id" className="block text-sm font-medium text-gray-700 mb-1">
                        Supplier *
                      </label>
                      <select
                        id="supplier_id"
                        value={formData.supplier_id}
                        onChange={(e) => handleInputChange('supplier_id', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.supplier_id ? 'border-red-300' : 'border-gray-300'
                        }`}
                        required
                      >
                        <option value="">Select Supplier</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name} ({supplier.code})
                          </option>
                        ))}
                      </select>
                      {errors.supplier_id && (
                        <p className="mt-1 text-sm text-red-600">{errors.supplier_id}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="order_date" className="block text-sm font-medium text-gray-700 mb-1">
                        Order Date *
                      </label>
                      <input
                        type="date"
                        id="order_date"
                        value={formData.order_date}
                        onChange={(e) => handleInputChange('order_date', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.order_date ? 'border-red-300' : 'border-gray-300'
                        }`}
                        required
                      />
                      {errors.order_date && (
                        <p className="mt-1 text-sm text-red-600">{errors.order_date}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="expected_date" className="block text-sm font-medium text-gray-700 mb-1">
                        Expected Date
                      </label>
                      <input
                        type="date"
                        id="expected_date"
                        value={formData.expected_date}
                        onChange={(e) => handleInputChange('expected_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1">
                        Reference
                      </label>
                      <input
                        type="text"
                        id="reference"
                        value={formData.reference}
                        onChange={(e) => handleInputChange('reference', e.target.value)}
                        placeholder="Reference number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                        Currency
                      </label>
                      <select
                        id="currency"
                        value={formData.currency}
                        onChange={(e) => handleInputChange('currency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="CAD">CAD</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Items Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
                    <button
                      type="button"
                      onClick={addItem}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Item
                    </button>
                  </div>

                  {errors.items && (
                    <p className="mb-4 text-sm text-red-600">{errors.items}</p>
                  )}

                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Product *
                            </label>
                            <select
                              value={item.product_id}
                              onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors[`item_${index}_product_id`] ? 'border-red-300' : 'border-gray-300'
                              }`}
                            >
                              <option value="">Select Product</option>
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name} ({product.sku})
                                </option>
                              ))}
                            </select>
                            {errors[`item_${index}_product_id`] && (
                              <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_product_id`]}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Quantity *
                            </label>
                            <input
                              type="number"
                              step="1"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors[`item_${index}_quantity`] ? 'border-red-300' : 'border-gray-300'
                              }`}
                            />
                            {errors[`item_${index}_quantity`] && (
                              <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_quantity`]}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Unit Price *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unit_price}
                              onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors[`item_${index}_unit_price`] ? 'border-red-300' : 'border-gray-300'
                              }`}
                            />
                            {errors[`item_${index}_unit_price`] && (
                              <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_unit_price`]}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Item Discount
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.discount_amount}
                              onChange={(e) => updateItem(index, 'discount_amount', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors[`item_${index}_discount_amount`] ? 'border-red-300' : 'border-gray-300'
                              }`}
                            />
                            {errors[`item_${index}_discount_amount`] && (
                              <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_discount_amount`]}</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                          </label>
                          <input
                            type="text"
                            value={item.notes}
                            onChange={(e) => updateItem(index, 'notes', e.target.value)}
                            placeholder="Item notes"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        {/* Item Total */}
                        <div className="mt-3 text-right">
                          <span className="text-sm font-medium text-gray-900">
                            Item Total: $
                            {(
                              (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0) - 
                              (parseFloat(item.discount_amount) || 0)
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="tax_rate" className="block text-sm font-medium text-gray-700 mb-1">
                        Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        id="tax_rate"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.tax_rate}
                        onChange={(e) => handleInputChange('tax_rate', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.tax_rate ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.tax_rate && (
                        <p className="mt-1 text-sm text-red-600">{errors.tax_rate}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="shipping_cost" className="block text-sm font-medium text-gray-700 mb-1">
                        Shipping Cost
                      </label>
                      <input
                        type="number"
                        id="shipping_cost"
                        step="0.01"
                        min="0"
                        value={formData.shipping_cost}
                        onChange={(e) => handleInputChange('shipping_cost', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.shipping_cost ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.shipping_cost && (
                        <p className="mt-1 text-sm text-red-600">{errors.shipping_cost}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="discount_amount" className="block text-sm font-medium text-gray-700 mb-1">
                        Order Discount
                      </label>
                      <input
                        type="number"
                        id="discount_amount"
                        step="0.01"
                        min="0"
                        value={formData.discount_amount}
                        onChange={(e) => handleInputChange('discount_amount', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.discount_amount ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.discount_amount && (
                        <p className="mt-1 text-sm text-red-600">{errors.discount_amount}</p>
                      )}
                    </div>
                  </div>

                  {/* Order Totals */}
                  <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>${totals.subTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax ({formData.tax_rate}%):</span>
                        <span>${totals.taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Shipping:</span>
                        <span>${totals.shippingCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Order Discount:</span>
                        <span>-${totals.orderDiscount.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-gray-300 pt-2 mt-2">
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Total:</span>
                          <span>${totals.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="terms" className="block text-sm font-medium text-gray-700 mb-1">
                        Terms & Conditions
                      </label>
                      <textarea
                        id="terms"
                        rows={3}
                        value={formData.terms}
                        onChange={(e) => handleInputChange('terms', e.target.value)}
                        placeholder="Payment terms, delivery terms, etc."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        id="notes"
                        rows={3}
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        placeholder="Additional notes"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Error Display */}
                {errors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">{errors.general}</p>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || loadingData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? 'Update' : 'Create'} Purchase Order
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderModal;