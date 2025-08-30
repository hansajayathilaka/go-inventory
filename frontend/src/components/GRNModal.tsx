import React, { useState, useEffect } from 'react';
import { X, FileText, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import type { 
  GRN, 
  CreateGRNRequest, 
  UpdateGRNRequest,
  CreateGRNItemRequest,
  PurchaseOrder,
  User
} from '../types/api';
import { api } from '../services/api';

interface GRNModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  grn?: GRN | null;
}

interface GRNFormData {
  purchase_order_id: string;
  location_id: string;
  received_date: string;
  delivery_note: string;
  invoice_number: string;
  invoice_date: string;
  vehicle_number: string;
  driver_name: string;
  quality_check: boolean;
  quality_notes: string;
  tax_rate: string;
  discount_amount: string;
  currency: string;
  notes: string;
  received_by_id: string;
}

interface GRNItemFormData {
  purchase_order_item_id: string;
  received_quantity: string;
  accepted_quantity: string;
  rejected_quantity: string;
  damaged_quantity: string;
  unit_price: string;
  expiry_date: string;
  batch_number: string;
  serial_numbers: string;
  quality_status: string;
  quality_notes: string;
}

// Use default location ID for single store
const DEFAULT_LOCATION_ID = '550e8400-e29b-41d4-a716-446655440000';

const GRNModal: React.FC<GRNModalProps> = ({
  isOpen,
  onClose,
  onSave,
  grn,
}) => {
  const [formData, setFormData] = useState<GRNFormData>({
    purchase_order_id: '',
    location_id: DEFAULT_LOCATION_ID, // Use default location for single store
    received_date: new Date().toISOString().split('T')[0],
    delivery_note: '',
    invoice_number: '',
    invoice_date: '',
    vehicle_number: '',
    driver_name: '',
    quality_check: false,
    quality_notes: '',
    tax_rate: '0',
    discount_amount: '0',
    currency: 'USD',
    notes: '',
    received_by_id: '',
  });

  const [items, setItems] = useState<GRNItemFormData[]>([]);
  const [newItem, setNewItem] = useState<GRNItemFormData>({
    purchase_order_item_id: '',
    received_quantity: '',
    accepted_quantity: '',
    rejected_quantity: '0',
    damaged_quantity: '0',
    unit_price: '',
    expiry_date: '',
    batch_number: '',
    serial_numbers: '',
    quality_status: 'pending',
    quality_notes: '',
  });

  // Dropdown data
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Loading and error states
  const [saving, setSaving] = useState(false);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load dropdown data
  const loadDropdownData = async () => {
    try {
      setLoadingDropdowns(true);
      
      // Load purchase orders (only approved ones)
      const poResponse = await api.purchaseOrders.list({ status: 'approved' });
      setPurchaseOrders(poResponse.data.data || []);

      // Load users for received_by dropdown
      const userResponse = await api.users.getActive();
      setUsers(userResponse.data.data || []);
    } catch (error) {
      console.error('Failed to load dropdown data:', error);
    } finally {
      setLoadingDropdowns(false);
    }
  };

  // Load existing GRN data
  useEffect(() => {
    if (grn) {
      setFormData({
        purchase_order_id: grn.purchase_order_id || '',
        location_id: grn.location_id || DEFAULT_LOCATION_ID,
        received_date: grn.received_date?.split('T')[0] || '',
        delivery_note: grn.delivery_note || '',
        invoice_number: grn.invoice_number || '',
        invoice_date: grn.invoice_date?.split('T')[0] || '',
        vehicle_number: grn.vehicle_number || '',
        driver_name: grn.driver_name || '',
        quality_check: grn.quality_check || false,
        quality_notes: grn.quality_notes || '',
        tax_rate: grn.tax_rate?.toString() || '0',
        discount_amount: grn.discount_amount?.toString() || '0',
        currency: grn.currency || 'USD',
        notes: grn.notes || '',
        received_by_id: grn.received_by_id || '',
      });

      // Load GRN items if editing
      loadGRNItems(grn.id);
    } else {
      // Reset form for new GRN
      setFormData({
        purchase_order_id: '',
        location_id: DEFAULT_LOCATION_ID,
        received_date: new Date().toISOString().split('T')[0],
        delivery_note: '',
        invoice_number: '',
        invoice_date: '',
        vehicle_number: '',
        driver_name: '',
        quality_check: false,
        quality_notes: '',
        tax_rate: '0',
        discount_amount: '0',
        currency: 'USD',
        notes: '',
        received_by_id: '',
      });
      setItems([]);
    }
  }, [grn]);

  // Load dropdown data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadDropdownData();
    }
  }, [isOpen]);

  // Load GRN items
  const loadGRNItems = async (grnId: string) => {
    try {
      const response = await api.grn.getItems(grnId);
      const grnItems = response.data || [];
      
      const itemsData: GRNItemFormData[] = grnItems.map((item: any) => ({
        purchase_order_item_id: item.purchase_order_item_id || '',
        received_quantity: item.received_quantity?.toString() || '',
        accepted_quantity: item.accepted_quantity?.toString() || '',
        rejected_quantity: item.rejected_quantity?.toString() || '0',
        damaged_quantity: item.damaged_quantity?.toString() || '0',
        unit_price: item.unit_price?.toString() || '',
        expiry_date: item.expiry_date?.split('T')[0] || '',
        batch_number: item.batch_number || '',
        serial_numbers: item.serial_numbers || '',
        quality_status: item.quality_status || 'pending',
        quality_notes: item.quality_notes || '',
      }));
      
      setItems(itemsData);
    } catch (error) {
      console.error('Failed to load GRN items:', error);
    }
  };

  // Handle form input changes
  const handleInputChange = (field: keyof GRNFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Handle new item input changes
  const handleNewItemChange = (field: keyof GRNItemFormData, value: string) => {
    setNewItem(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add new item to list
  const addItem = () => {
    if (!newItem.purchase_order_item_id || !newItem.received_quantity || !newItem.accepted_quantity) {
      alert('Please fill in all required item fields');
      return;
    }

    setItems(prev => [...prev, { ...newItem }]);
    setNewItem({
      purchase_order_item_id: '',
      received_quantity: '',
      accepted_quantity: '',
      rejected_quantity: '0',
      damaged_quantity: '0',
      unit_price: '',
      expiry_date: '',
      batch_number: '',
      serial_numbers: '',
      quality_status: 'pending',
      quality_notes: '',
    });
  };

  // Remove item from list
  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Update item in list
  const updateItem = (index: number, field: keyof GRNItemFormData, value: string) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.purchase_order_id) newErrors.purchase_order_id = 'Purchase order is required';
    if (!formData.received_date) newErrors.received_date = 'Received date is required';
    if (!formData.received_by_id) newErrors.received_by_id = 'Received by user is required';

    // Validate tax rate
    const taxRate = parseFloat(formData.tax_rate);
    if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
      newErrors.tax_rate = 'Tax rate must be between 0 and 100';
    }

    // Validate discount
    const discount = parseFloat(formData.discount_amount);
    if (isNaN(discount) || discount < 0) {
      newErrors.discount_amount = 'Discount must be 0 or greater';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      const accepted = parseFloat(item.accepted_quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      return sum + (accepted * unitPrice);
    }, 0);

    const taxRate = parseFloat(formData.tax_rate) || 0;
    const discount = parseFloat(formData.discount_amount) || 0;
    
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount - discount;

    return {
      subtotal,
      taxAmount,
      discount,
      total: Math.max(0, total)
    };
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const itemsData: CreateGRNItemRequest[] = items.map(item => ({
        purchase_order_item_id: item.purchase_order_item_id,
        received_quantity: parseFloat(item.received_quantity),
        accepted_quantity: parseFloat(item.accepted_quantity),
        rejected_quantity: parseFloat(item.rejected_quantity) || 0,
        damaged_quantity: parseFloat(item.damaged_quantity) || 0,
        unit_price: parseFloat(item.unit_price),
        expiry_date: item.expiry_date || undefined,
        batch_number: item.batch_number || undefined,
        serial_numbers: item.serial_numbers || undefined,
        quality_status: item.quality_status || undefined,
        quality_notes: item.quality_notes || undefined,
      }));

      if (grn) {
        // Update existing GRN
        const updateData: UpdateGRNRequest = {
          location_id: formData.location_id,
          received_date: formData.received_date,
          delivery_note: formData.delivery_note || undefined,
          invoice_number: formData.invoice_number || undefined,
          invoice_date: formData.invoice_date || undefined,
          vehicle_number: formData.vehicle_number || undefined,
          driver_name: formData.driver_name || undefined,
          quality_check: formData.quality_check,
          quality_notes: formData.quality_notes || undefined,
          tax_rate: parseFloat(formData.tax_rate) || 0,
          discount_amount: parseFloat(formData.discount_amount) || 0,
          currency: formData.currency,
          notes: formData.notes || undefined,
          received_by_id: formData.received_by_id,
        };

        await api.grn.update(grn.id, updateData);
      } else {
        // Create new GRN
        const createData: CreateGRNRequest = {
          purchase_order_id: formData.purchase_order_id,
          location_id: formData.location_id,
          received_date: formData.received_date,
          delivery_note: formData.delivery_note || undefined,
          invoice_number: formData.invoice_number || undefined,
          invoice_date: formData.invoice_date || undefined,
          vehicle_number: formData.vehicle_number || undefined,
          driver_name: formData.driver_name || undefined,
          quality_check: formData.quality_check,
          quality_notes: formData.quality_notes || undefined,
          tax_rate: parseFloat(formData.tax_rate) || 0,
          discount_amount: parseFloat(formData.discount_amount) || 0,
          currency: formData.currency,
          notes: formData.notes || undefined,
          received_by_id: formData.received_by_id,
          items: itemsData,
        };

        await api.grn.create(createData);
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Failed to save GRN:', error);
      alert(error.response?.data?.message || 'Failed to save GRN');
    } finally {
      setSaving(false);
    }
  };

  const totals = calculateTotals();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {grn ? 'Edit GRN' : 'Create New GRN'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
            disabled={saving}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loadingDropdowns ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Order *
                    </label>
                    <select
                      value={formData.purchase_order_id}
                      onChange={(e) => handleInputChange('purchase_order_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!!grn} // Disable when editing
                    >
                      <option value="">Select Purchase Order</option>
                      {purchaseOrders.map(po => (
                        <option key={po.id} value={po.id}>
                          {po.po_number} - {po.supplier_id}
                        </option>
                      ))}
                    </select>
                    {errors.purchase_order_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.purchase_order_id}</p>
                    )}
                  </div>

                  {/* Location is automatically set to default for single store */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Store Location
                    </label>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600">
                      Main Store Location
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Single store mode - location is automatically set</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Received Date *
                    </label>
                    <input
                      type="date"
                      value={formData.received_date}
                      onChange={(e) => handleInputChange('received_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.received_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.received_date}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Received By *
                    </label>
                    <select
                      value={formData.received_by_id}
                      onChange={(e) => handleInputChange('received_by_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select User</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.username}
                        </option>
                      ))}
                    </select>
                    {errors.received_by_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.received_by_id}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="INR">INR</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Delivery & Invoice Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery & Invoice Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Note
                    </label>
                    <input
                      type="text"
                      value={formData.delivery_note}
                      onChange={(e) => handleInputChange('delivery_note', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter delivery note number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      value={formData.invoice_number}
                      onChange={(e) => handleInputChange('invoice_number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter invoice number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice Date
                    </label>
                    <input
                      type="date"
                      value={formData.invoice_date}
                      onChange={(e) => handleInputChange('invoice_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Number
                    </label>
                    <input
                      type="text"
                      value={formData.vehicle_number}
                      onChange={(e) => handleInputChange('vehicle_number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter vehicle number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Driver Name
                    </label>
                    <input
                      type="text"
                      value={formData.driver_name}
                      onChange={(e) => handleInputChange('driver_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter driver name"
                    />
                  </div>
                </div>
              </div>

              {/* Quality Control */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quality Control</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="quality_check"
                      checked={formData.quality_check}
                      onChange={(e) => handleInputChange('quality_check', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="quality_check" className="ml-2 block text-sm text-gray-900">
                      Quality check performed
                    </label>
                  </div>

                  {formData.quality_check && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quality Notes
                      </label>
                      <textarea
                        value={formData.quality_notes}
                        onChange={(e) => handleInputChange('quality_notes', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter quality control notes..."
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.tax_rate}
                      onChange={(e) => handleInputChange('tax_rate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.tax_rate && (
                      <p className="mt-1 text-sm text-red-600">{errors.tax_rate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.discount_amount}
                      onChange={(e) => handleInputChange('discount_amount', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.discount_amount && (
                      <p className="mt-1 text-sm text-red-600">{errors.discount_amount}</p>
                    )}
                  </div>
                </div>

                {/* Totals Summary */}
                <div className="mt-4 bg-white p-4 rounded border">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{totals.subtotal.toFixed(2)} {formData.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>{totals.taxAmount.toFixed(2)} {formData.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-{totals.discount.toFixed(2)} {formData.currency}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>{totals.total.toFixed(2)} {formData.currency}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Items</h3>
                
                {/* Add New Item Form */}
                <div className="bg-white p-4 rounded border mb-4">
                  <h4 className="font-medium text-gray-900 mb-3">Add Item</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <input
                        type="text"
                        value={newItem.purchase_order_item_id}
                        onChange={(e) => handleNewItemChange('purchase_order_item_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="PO Item ID"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newItem.received_quantity}
                        onChange={(e) => handleNewItemChange('received_quantity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Received Qty"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newItem.accepted_quantity}
                        onChange={(e) => handleNewItemChange('accepted_quantity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Accepted Qty"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={addItem}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center"
                      >
                        <Plus size={16} className="mr-1" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                {items.length > 0 && (
                  <div className="bg-white rounded border overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            PO Item ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Received
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Accepted
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Rejected
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Unit Price
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Quality
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {item.purchase_order_item_id.substring(0, 8)}...
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                step="0.01"
                                value={item.received_quantity}
                                onChange={(e) => updateItem(index, 'received_quantity', e.target.value)}
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                step="0.01"
                                value={item.accepted_quantity}
                                onChange={(e) => updateItem(index, 'accepted_quantity', e.target.value)}
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                step="0.01"
                                value={item.rejected_quantity}
                                onChange={(e) => updateItem(index, 'rejected_quantity', e.target.value)}
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={item.quality_status}
                                onChange={(e) => updateItem(index, 'quality_status', e.target.value)}
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                              >
                                <option value="pending">Pending</option>
                                <option value="passed">Passed</option>
                                <option value="failed">Failed</option>
                              </select>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="p-1 text-red-500 hover:text-red-700"
                                title="Remove Item"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter any additional notes..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loadingDropdowns}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <Save size={16} className="mr-2" />
            )}
            {saving ? 'Saving...' : 'Save GRN'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GRNModal;