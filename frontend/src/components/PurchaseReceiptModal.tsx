import React, { useState, useEffect } from 'react';
import { X, FileText, Save, Loader2, Plus, Trash2, Package } from 'lucide-react';
import type { 
  PurchaseReceipt, 
  Supplier,
  Product
} from '../types/api';
import { api } from '../services/api';

interface PurchaseReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  purchaseReceipt?: PurchaseReceipt | null;
  mode?: 'order' | 'receive' | 'view';
}

interface PurchaseReceiptFormData {
  supplier_id: string;
  order_date: string;
  expected_date: string;
  reference: string;
  terms: string;
  order_notes: string;
  
  // Receipt fields
  received_date: string;
  delivery_date: string;
  delivery_note: string;
  invoice_number: string;
  invoice_date: string;
  vehicle_number: string;
  driver_name: string;
  quality_check: boolean;
  quality_notes: string;
  receipt_notes: string;
  
  // Financial fields
  tax_rate: string;
  shipping_cost: string;
  discount_amount: string;
  currency: string;
}

interface PRItemFormData {
  product_id: string;
  
  // Order fields
  ordered_quantity: string;
  unit_price: string;
  discount_amount: string;
  order_notes: string;
  
  // Receipt fields
  received_quantity: string;
  accepted_quantity: string;
  rejected_quantity: string;
  damaged_quantity: string;
  expiry_date: string;
  batch_number: string;
  serial_numbers: string;
  quality_status: string;
  quality_notes: string;
  receipt_notes: string;
}

const PurchaseReceiptModal: React.FC<PurchaseReceiptModalProps> = ({
  isOpen,
  onClose,
  onSave,
  purchaseReceipt,
  mode = 'order',
}) => {
  const [formData, setFormData] = useState<PurchaseReceiptFormData>({
    supplier_id: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_date: '',
    reference: '',
    terms: '',
    order_notes: '',
    
    received_date: '',
    delivery_date: '',
    delivery_note: '',
    invoice_number: '',
    invoice_date: '',
    vehicle_number: '',
    driver_name: '',
    quality_check: false,
    quality_notes: '',
    receipt_notes: '',
    
    tax_rate: '0',
    shipping_cost: '0',
    discount_amount: '0',
    currency: 'MYR',
  });

  const [items, setItems] = useState<PRItemFormData[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'order' | 'receipt' | 'financial'>('order');

  const isEditing = !!purchaseReceipt;
  const isViewMode = mode === 'view';
  const isReceiptMode = mode === 'receive';
  const isReceiptPhase = purchaseReceipt?.status && ['received', 'partial', 'completed'].includes(purchaseReceipt.status);

  // Load suppliers and products when modal opens
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      
      // Set default tab based on mode and status
      if (isReceiptMode || isReceiptPhase) {
        setActiveTab('receipt');
      } else {
        setActiveTab('order');
      }
    }
  }, [isOpen, mode]);

  // Reset form when modal opens/closes or purchase receipt changes
  useEffect(() => {
    if (isOpen) {
      if (purchaseReceipt) {
        setFormData({
          supplier_id: purchaseReceipt.supplier_id || '',
          order_date: purchaseReceipt.order_date?.split('T')[0] || new Date().toISOString().split('T')[0],
          expected_date: purchaseReceipt.expected_date?.split('T')[0] || '',
          reference: purchaseReceipt.reference || '',
          terms: purchaseReceipt.terms || '',
          order_notes: purchaseReceipt.order_notes || '',
          
          received_date: purchaseReceipt.received_date?.split('T')[0] || '',
          delivery_date: purchaseReceipt.delivery_date?.split('T')[0] || '',
          delivery_note: purchaseReceipt.delivery_note || '',
          invoice_number: purchaseReceipt.invoice_number || '',
          invoice_date: purchaseReceipt.invoice_date?.split('T')[0] || '',
          vehicle_number: purchaseReceipt.vehicle_number || '',
          driver_name: purchaseReceipt.driver_name || '',
          quality_check: purchaseReceipt.quality_check || false,
          quality_notes: purchaseReceipt.quality_notes || '',
          receipt_notes: purchaseReceipt.receipt_notes || '',
          
          tax_rate: purchaseReceipt.tax_rate?.toString() || '0',
          shipping_cost: purchaseReceipt.shipping_cost?.toString() || '0',
          discount_amount: purchaseReceipt.discount_amount?.toString() || '0',
          currency: purchaseReceipt.currency || 'MYR',
        });
        
        // Load existing items
        if (purchaseReceipt.items) {
          setItems(purchaseReceipt.items.map(item => ({
            product_id: item.product_id,
            
            ordered_quantity: item.ordered_quantity.toString(),
            unit_price: item.unit_price.toString(),
            discount_amount: item.discount_amount?.toString() || '0',
            order_notes: item.order_notes || '',
            
            received_quantity: item.received_quantity?.toString() || '0',
            accepted_quantity: item.accepted_quantity?.toString() || '0',
            rejected_quantity: item.rejected_quantity?.toString() || '0',
            damaged_quantity: item.damaged_quantity?.toString() || '0',
            expiry_date: item.expiry_date?.split('T')[0] || '',
            batch_number: item.batch_number || '',
            serial_numbers: item.serial_numbers || '',
            quality_status: item.quality_status || 'good',
            quality_notes: item.quality_notes || '',
            receipt_notes: item.receipt_notes || '',
          })));
        }
      } else {
        resetForm();
      }
    }
  }, [isOpen, purchaseReceipt]);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      const [suppliersRes, productsRes] = await Promise.all([
        api.suppliers.getActive(),
        api.products.getActive(),
      ]);
      
      setSuppliers(suppliersRes.data || []);
      setProducts(productsRes.data || []);
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const resetForm = () => {
    setFormData({
      supplier_id: '',
      order_date: new Date().toISOString().split('T')[0],
      expected_date: '',
      reference: '',
      terms: '',
      order_notes: '',
      
      received_date: '',
      delivery_date: '',
      delivery_note: '',
      invoice_number: '',
      invoice_date: '',
      vehicle_number: '',
      driver_name: '',
      quality_check: false,
      quality_notes: '',
      receipt_notes: '',
      
      tax_rate: '0',
      shipping_cost: '0',
      discount_amount: '0',
      currency: 'MYR',
    });
    setItems([]);
    setErrors({});
  };

  const handleInputChange = (field: keyof PurchaseReceiptFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addItem = () => {
    const newItem: PRItemFormData = {
      product_id: '',
      ordered_quantity: '1',
      unit_price: '0',
      discount_amount: '0',
      order_notes: '',
      
      received_quantity: '0',
      accepted_quantity: '0',
      rejected_quantity: '0',
      damaged_quantity: '0',
      expiry_date: '',
      batch_number: '',
      serial_numbers: '',
      quality_status: 'good',
      quality_notes: '',
      receipt_notes: '',
    };
    setItems(prev => [...prev, newItem]);
  };

  const updateItem = (index: number, field: keyof PRItemFormData, value: string) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subTotal = items.reduce((sum, item) => {
      const qty = parseFloat(item.ordered_quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      const discount = parseFloat(item.discount_amount) || 0;
      return sum + (qty * price) - discount;
    }, 0);

    const taxRate = parseFloat(formData.tax_rate) || 0;
    const shippingCost = parseFloat(formData.shipping_cost) || 0;
    const overallDiscount = parseFloat(formData.discount_amount) || 0;
    
    const taxAmount = (subTotal * taxRate) / 100;
    const totalAmount = subTotal + taxAmount + shippingCost - overallDiscount;

    return {
      subTotal,
      taxAmount,
      totalAmount: Math.max(0, totalAmount)
    };
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.supplier_id) {
      newErrors.supplier_id = 'Supplier is required';
    }

    if (!formData.order_date) {
      newErrors.order_date = 'Order date is required';
    }

    if (items.length === 0) {
      newErrors.items = 'At least one item is required';
    }

    items.forEach((item, index) => {
      if (!item.product_id) {
        newErrors[`item_${index}_product`] = 'Product is required';
      }
      
      const orderedQty = parseFloat(item.ordered_quantity);
      if (!orderedQty || orderedQty <= 0) {
        newErrors[`item_${index}_quantity`] = 'Ordered quantity must be greater than 0';
      }
      
      const unitPrice = parseFloat(item.unit_price);
      if (unitPrice < 0) {
        newErrors[`item_${index}_price`] = 'Unit price cannot be negative';
      }

      // Receipt validation
      if (isReceiptMode || isReceiptPhase) {
        const receivedQty = parseFloat(item.received_quantity);
        const acceptedQty = parseFloat(item.accepted_quantity);
        const rejectedQty = parseFloat(item.rejected_quantity);
        const damagedQty = parseFloat(item.damaged_quantity);

        if (receivedQty < 0 || acceptedQty < 0 || rejectedQty < 0 || damagedQty < 0) {
          newErrors[`item_${index}_receipt_quantities`] = 'Quantities cannot be negative';
        }

        if ((acceptedQty + rejectedQty + damagedQty) !== receivedQty) {
          newErrors[`item_${index}_receipt_total`] = 'Accepted + Rejected + Damaged must equal Received quantity';
        }
      }
    });

    // Receipt-specific validation
    if (isReceiptMode && !formData.received_date) {
      newErrors.received_date = 'Received date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const submitData = {
        ...formData,
        tax_rate: parseFloat(formData.tax_rate),
        shipping_cost: parseFloat(formData.shipping_cost),
        discount_amount: parseFloat(formData.discount_amount),
        items: items.map(item => ({
          product_id: item.product_id,
          
          ordered_quantity: parseInt(item.ordered_quantity),
          unit_price: parseFloat(item.unit_price),
          discount_amount: parseFloat(item.discount_amount),
          order_notes: item.order_notes,
          
          ...(isReceiptMode || isReceiptPhase ? {
            received_quantity: parseInt(item.received_quantity),
            accepted_quantity: parseInt(item.accepted_quantity),
            rejected_quantity: parseInt(item.rejected_quantity),
            damaged_quantity: parseInt(item.damaged_quantity),
            expiry_date: item.expiry_date || undefined,
            batch_number: item.batch_number,
            serial_numbers: item.serial_numbers,
            quality_status: item.quality_status,
            quality_notes: item.quality_notes,
            receipt_notes: item.receipt_notes,
          } : {})
        })),
      };

      if (isEditing) {
        await api.purchaseReceipts.update(purchaseReceipt.id, submitData);
      } else {
        await api.purchaseReceipts.create(submitData);
      }

      onSave();
      handleClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to save purchase receipt';
      setErrors({ submit: errorMessage });
      console.error('Error saving purchase receipt:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? `${product.name} (${product.sku})` : '';
  };

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.name || '';
  };

  if (!isOpen) return null;

  const totals = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <FileText className="text-blue-600" size={24} />
            <div>
              <h2 className="text-lg font-semibold">
                {isEditing 
                  ? (isReceiptMode ? 'Process Receipt' : 'Edit Purchase Receipt')
                  : 'Create Purchase Receipt'
                }
              </h2>
              {purchaseReceipt && (
                <p className="text-sm text-gray-600">
                  {purchaseReceipt.receipt_number} - {getSupplierName(purchaseReceipt.supplier_id)}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin mr-2" size={20} />
            <span>Loading data...</span>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Tabs */}
            <div className="flex border-b bg-gray-50">
              <button
                onClick={() => setActiveTab('order')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'order'
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                disabled={isReceiptMode}
              >
                Order Information
              </button>
              <button
                onClick={() => setActiveTab('receipt')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'receipt'
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Package size={16} className="inline mr-1" />
                Receipt Information
              </button>
              <button
                onClick={() => setActiveTab('financial')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'financial'
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Financial Summary
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Order Information Tab */}
              {activeTab === 'order' && (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Supplier *
                      </label>
                      <select
                        value={formData.supplier_id}
                        onChange={(e) => handleInputChange('supplier_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isViewMode || (isEditing && isReceiptPhase)}
                      >
                        <option value="">Select supplier</option>
                        {suppliers.map(supplier => (
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Order Date *
                      </label>
                      <input
                        type="date"
                        value={formData.order_date}
                        onChange={(e) => handleInputChange('order_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isViewMode}
                      />
                      {errors.order_date && (
                        <p className="mt-1 text-sm text-red-600">{errors.order_date}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expected Date
                      </label>
                      <input
                        type="date"
                        value={formData.expected_date}
                        onChange={(e) => handleInputChange('expected_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isViewMode}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reference
                      </label>
                      <input
                        type="text"
                        value={formData.reference}
                        onChange={(e) => handleInputChange('reference', e.target.value)}
                        placeholder="Reference number or code"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isViewMode}
                      />
                    </div>
                  </div>

                  {/* Terms and Notes */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Terms & Conditions
                      </label>
                      <textarea
                        value={formData.terms}
                        onChange={(e) => handleInputChange('terms', e.target.value)}
                        placeholder="Payment terms, delivery conditions, etc."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isViewMode}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Order Notes
                      </label>
                      <textarea
                        value={formData.order_notes}
                        onChange={(e) => handleInputChange('order_notes', e.target.value)}
                        placeholder="Additional notes about this order"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isViewMode}
                      />
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">Order Items</h3>
                      {!isViewMode && (
                        <button
                          type="button"
                          onClick={addItem}
                          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Plus size={16} />
                          Add Item
                        </button>
                      )}
                    </div>

                    {errors.items && (
                      <p className="mb-4 text-sm text-red-600">{errors.items}</p>
                    )}

                    <div className="space-y-4">
                      {items.map((item, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="lg:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Product *
                              </label>
                              <select
                                value={item.product_id}
                                onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={isViewMode}
                              >
                                <option value="">Select product</option>
                                {products.map(product => (
                                  <option key={product.id} value={product.id}>
                                    {product.name} ({product.sku})
                                  </option>
                                ))}
                              </select>
                              {errors[`item_${index}_product`] && (
                                <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_product`]}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantity *
                              </label>
                              <input
                                type="number"
                                value={item.ordered_quantity}
                                onChange={(e) => updateItem(index, 'ordered_quantity', e.target.value)}
                                min="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={isViewMode}
                              />
                              {errors[`item_${index}_quantity`] && (
                                <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_quantity`]}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Unit Price
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={isViewMode}
                              />
                              {errors[`item_${index}_price`] && (
                                <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_price`]}</p>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Item Discount
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={item.discount_amount}
                                onChange={(e) => updateItem(index, 'discount_amount', e.target.value)}
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={isViewMode}
                              />
                            </div>

                            <div className="flex items-end">
                              {!isViewMode && (
                                <button
                                  type="button"
                                  onClick={() => removeItem(index)}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 size={16} />
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Item Notes
                            </label>
                            <input
                              type="text"
                              value={item.order_notes}
                              onChange={(e) => updateItem(index, 'order_notes', e.target.value)}
                              placeholder="Special instructions for this item"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              disabled={isViewMode}
                            />
                          </div>

                          <div className="mt-2 text-right text-sm text-gray-600">
                            Line Total: {((parseFloat(item.ordered_quantity) || 0) * (parseFloat(item.unit_price) || 0) - (parseFloat(item.discount_amount) || 0)).toFixed(2)} {formData.currency}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Receipt Information Tab */}
              {activeTab === 'receipt' && (
                <div className="space-y-6">
                  {/* Receipt Header Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Received Date {isReceiptMode && '*'}
                      </label>
                      <input
                        type="date"
                        value={formData.received_date}
                        onChange={(e) => handleInputChange('received_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isViewMode}
                      />
                      {errors.received_date && (
                        <p className="mt-1 text-sm text-red-600">{errors.received_date}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Date
                      </label>
                      <input
                        type="date"
                        value={formData.delivery_date}
                        onChange={(e) => handleInputChange('delivery_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isViewMode}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Note
                      </label>
                      <input
                        type="text"
                        value={formData.delivery_note}
                        onChange={(e) => handleInputChange('delivery_note', e.target.value)}
                        placeholder="Delivery note number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isViewMode}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Invoice Number
                      </label>
                      <input
                        type="text"
                        value={formData.invoice_number}
                        onChange={(e) => handleInputChange('invoice_number', e.target.value)}
                        placeholder="Supplier invoice number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isViewMode}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Invoice Date
                      </label>
                      <input
                        type="date"
                        value={formData.invoice_date}
                        onChange={(e) => handleInputChange('invoice_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isViewMode}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vehicle Number
                      </label>
                      <input
                        type="text"
                        value={formData.vehicle_number}
                        onChange={(e) => handleInputChange('vehicle_number', e.target.value)}
                        placeholder="Delivery vehicle number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isViewMode}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Driver Name
                      </label>
                      <input
                        type="text"
                        value={formData.driver_name}
                        onChange={(e) => handleInputChange('driver_name', e.target.value)}
                        placeholder="Name of the driver"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isViewMode}
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="quality_check"
                        checked={formData.quality_check}
                        onChange={(e) => handleInputChange('quality_check', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={isViewMode}
                      />
                      <label htmlFor="quality_check" className="ml-2 text-sm text-gray-700">
                        Quality check performed
                      </label>
                    </div>
                  </div>

                  {/* Quality Notes */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quality Notes
                      </label>
                      <textarea
                        value={formData.quality_notes}
                        onChange={(e) => handleInputChange('quality_notes', e.target.value)}
                        placeholder="Quality control observations"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isViewMode}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Receipt Notes
                      </label>
                      <textarea
                        value={formData.receipt_notes}
                        onChange={(e) => handleInputChange('receipt_notes', e.target.value)}
                        placeholder="General notes about the receipt"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isViewMode}
                      />
                    </div>
                  </div>

                  {/* Receipt Items */}
                  {(isReceiptMode || isReceiptPhase) && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">Receipt Items</h3>
                      <div className="space-y-4">
                        {items.map((item, index) => (
                          <div key={index} className="p-4 border border-gray-200 rounded-lg">
                            <div className="mb-3">
                              <h4 className="font-medium text-gray-900">
                                {getProductName(item.product_id)}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Ordered Quantity: {item.ordered_quantity}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Received
                                </label>
                                <input
                                  type="number"
                                  value={item.received_quantity}
                                  onChange={(e) => updateItem(index, 'received_quantity', e.target.value)}
                                  min="0"
                                  max={item.ordered_quantity}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  disabled={isViewMode}
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Accepted
                                </label>
                                <input
                                  type="number"
                                  value={item.accepted_quantity}
                                  onChange={(e) => updateItem(index, 'accepted_quantity', e.target.value)}
                                  min="0"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  disabled={isViewMode}
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Rejected
                                </label>
                                <input
                                  type="number"
                                  value={item.rejected_quantity}
                                  onChange={(e) => updateItem(index, 'rejected_quantity', e.target.value)}
                                  min="0"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  disabled={isViewMode}
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Damaged
                                </label>
                                <input
                                  type="number"
                                  value={item.damaged_quantity}
                                  onChange={(e) => updateItem(index, 'damaged_quantity', e.target.value)}
                                  min="0"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  disabled={isViewMode}
                                />
                              </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Quality Status
                                </label>
                                <select
                                  value={item.quality_status}
                                  onChange={(e) => updateItem(index, 'quality_status', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  disabled={isViewMode}
                                >
                                  <option value="good">Good</option>
                                  <option value="damaged">Damaged</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Batch Number
                                </label>
                                <input
                                  type="text"
                                  value={item.batch_number}
                                  onChange={(e) => updateItem(index, 'batch_number', e.target.value)}
                                  placeholder="Batch/lot number"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  disabled={isViewMode}
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Expiry Date
                                </label>
                                <input
                                  type="date"
                                  value={item.expiry_date}
                                  onChange={(e) => updateItem(index, 'expiry_date', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  disabled={isViewMode}
                                />
                              </div>
                            </div>

                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Serial Numbers
                              </label>
                              <input
                                type="text"
                                value={item.serial_numbers}
                                onChange={(e) => updateItem(index, 'serial_numbers', e.target.value)}
                                placeholder="Comma-separated serial numbers"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={isViewMode}
                              />
                            </div>

                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quality Notes
                              </label>
                              <textarea
                                value={item.quality_notes}
                                onChange={(e) => updateItem(index, 'quality_notes', e.target.value)}
                                placeholder="Quality control notes for this item"
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={isViewMode}
                              />
                            </div>

                            {(errors[`item_${index}_receipt_quantities`] || errors[`item_${index}_receipt_total`]) && (
                              <div className="mt-2 text-sm text-red-600">
                                {errors[`item_${index}_receipt_quantities`] || errors[`item_${index}_receipt_total`]}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Financial Summary Tab */}
              {activeTab === 'financial' && (
                <div className="space-y-6">
                  {/* Financial Settings */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.tax_rate}
                        onChange={(e) => handleInputChange('tax_rate', e.target.value)}
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isViewMode}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Shipping Cost
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.shipping_cost}
                        onChange={(e) => handleInputChange('shipping_cost', e.target.value)}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isViewMode}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Overall Discount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.discount_amount}
                        onChange={(e) => handleInputChange('discount_amount', e.target.value)}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isViewMode}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => handleInputChange('currency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isViewMode}
                      >
                        <option value="MYR">MYR</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="SGD">SGD</option>
                      </select>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium mb-4">Financial Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{totals.subTotal.toFixed(2)} {formData.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax ({formData.tax_rate}%):</span>
                        <span>{totals.taxAmount.toFixed(2)} {formData.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>{parseFloat(formData.shipping_cost).toFixed(2)} {formData.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span>-{parseFloat(formData.discount_amount).toFixed(2)} {formData.currency}</span>
                      </div>
                      <div className="border-t pt-3 flex justify-between text-lg font-semibold">
                        <span>Total Amount:</span>
                        <span>{totals.totalAmount.toFixed(2)} {formData.currency}</span>
                      </div>
                    </div>
                  </div>

                  {/* Items Summary */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Items Summary</h3>
                    <div className="space-y-3">
                      {items.map((item, index) => {
                        const product = products.find(p => p.id === item.product_id);
                        const lineTotal = (parseFloat(item.ordered_quantity) || 0) * (parseFloat(item.unit_price) || 0) - (parseFloat(item.discount_amount) || 0);
                        
                        return (
                          <div key={index} className="flex justify-between items-center p-3 bg-white rounded border">
                            <div>
                              <span className="font-medium">{product?.name || 'Unknown Product'}</span>
                              <div className="text-sm text-gray-600">
                                {item.ordered_quantity} × {parseFloat(item.unit_price).toFixed(2)} 
                                {parseFloat(item.discount_amount) > 0 && ` - ${parseFloat(item.discount_amount).toFixed(2)}`}
                              </div>
                            </div>
                            <span className="font-medium">{lineTotal.toFixed(2)} {formData.currency}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t px-6 py-4 bg-gray-50">
              {errors.submit && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
                  {errors.submit}
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Total: {totals.totalAmount.toFixed(2)} {formData.currency}
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    disabled={loading}
                  >
                    {isViewMode ? 'Close' : 'Cancel'}
                  </button>
                  
                  {!isViewMode && (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          {isEditing ? 'Update' : 'Create'}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseReceiptModal;