import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package, User, DollarSign, Plus, Trash2, Save, Send } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductCombobox } from '@/components/ui/product-combobox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { api, extractListData } from '../services/api';
import type { Product, Supplier, PurchaseReceipt, CreatePurchaseReceiptRequest, PurchaseReceiptItem } from '../types/api';

interface PurchaseReceiptFormData {
  supplier_id: string;
  status: 'draft' | 'approved' | 'sent' | 'received' | 'partial' | 'completed' | 'cancelled';
  order_date: string;
  expected_date?: string;
  received_date?: string;
  total_cost: number;
  order_notes?: string;
  items: PurchaseReceiptItem[];
}

interface PurchaseReceiptItemForm {
  product_id: string;
  product_name?: string;
  sku?: string;
  ordered_quantity: number;
  received_quantity: number;
  unit_price: number;
  total_price: number;
  order_notes?: string;
}

const CreatePurchaseReceiptPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<PurchaseReceiptFormData>({
    supplier_id: '',
    status: 'draft',
    order_date: new Date().toISOString().split('T')[0],
    expected_date: '',
    received_date: '',
    total_cost: 0,
    order_notes: '',
    items: []
  });

  const [items, setItems] = useState<PurchaseReceiptItemForm[]>([]);
  const [saving, setSaving] = useState(false);

  // Fetch data
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await api.get('/suppliers');
      const data = extractListData<Supplier>(response);
      return data.data || [];
    }
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/products');
      const data = extractListData<Product>(response);
      return data.data || [];
    }
  });

  // Load existing purchase receipt for edit
  useEffect(() => {
    if (isEdit && id) {
      loadPurchaseReceipt(id);
    }
  }, [isEdit, id]);

  const loadPurchaseReceipt = async (receiptId: string) => {
    try {
      const response = await api.get(`/purchase-receipts/${receiptId}`);
      const receipt = (response.data as any).data as PurchaseReceipt;
      
      setFormData({
        supplier_id: receipt.supplier_id,
        status: receipt.status === 'pending' ? 'draft' : receipt.status as any,
        order_date: receipt.order_date,
        expected_date: receipt.expected_date || '',
        received_date: receipt.received_date || '',
        total_cost: receipt.total_amount || 0,
        order_notes: receipt.order_notes || '',
        items: receipt.items || []
      });

      // Convert items for editing
      const formItems: PurchaseReceiptItemForm[] = (receipt.items || []).map(item => ({
        product_id: item.product_id,
        product_name: item.product?.name || '',
        sku: item.product?.sku || '',
        ordered_quantity: item.ordered_quantity,
        received_quantity: item.received_quantity || 0,
        unit_price: item.unit_price,
        total_price: item.total_price,
        order_notes: item.order_notes || ''
      }));
      setItems(formItems);
    } catch (error) {
      console.error('Error loading purchase receipt:', error);
      toast({
        variant: "destructive",
        title: "Error loading purchase receipt",
        description: "Please try again later.",
      });
    }
  };

  const addItem = () => {
    setItems([...items, {
      product_id: '',
      product_name: '',
      sku: '',
      ordered_quantity: 1,
      received_quantity: 0,
      unit_price: 0,
      total_price: 0,
      order_notes: ''
    }]);
  };

  const updateItem = (index: number, field: keyof PurchaseReceiptItemForm, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-calculate total price
    if (field === 'ordered_quantity' || field === 'unit_price') {
      newItems[index].total_price = newItems[index].ordered_quantity * newItems[index].unit_price;
    }

    // Auto-fill product details when product is selected
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].product_name = product.name;
        newItems[index].sku = product.sku;
        newItems[index].unit_price = product.cost_price;
        // Ensure ordered_quantity is set, default to 1 if not set
        const quantity = newItems[index].ordered_quantity || 1;
        newItems[index].total_price = quantity * product.cost_price;
      }
    }

    setItems(newItems);

    // Update total cost
    const total = newItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
    setFormData(prev => ({ ...prev, total_cost: isNaN(total) ? 0 : total }));
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    const total = newItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
    setFormData(prev => ({ ...prev, total_cost: isNaN(total) ? 0 : total }));
  };

  const handleSave = async () => {
    if (saving) return;

    if (!formData.supplier_id) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a supplier.",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please add at least one item.",
      });
      return;
    }

    try {
      setSaving(true);

      const requestData: CreatePurchaseReceiptRequest = {
        supplier_id: formData.supplier_id,
        order_date: formData.order_date,
        expected_date: formData.expected_date,
        order_notes: formData.order_notes,
        items: items.map(item => ({
          product_id: item.product_id,
          ordered_quantity: item.ordered_quantity,
          unit_price: item.unit_price,
          order_notes: item.order_notes
        }))
      };

      if (isEdit && id) {
        await api.put(`/purchase-receipts/${id}`, requestData);
        toast({
          title: "Purchase receipt updated",
          description: "The purchase receipt has been updated successfully.",
        });
      } else {
        await api.post('/purchase-receipts', requestData);
        toast({
          title: "Purchase receipt created",
          description: "The purchase receipt has been created successfully.",
        });
      }

      navigate('/purchase-receipts');
    } catch (error) {
      console.error('Error saving purchase receipt:', error);
      toast({
        variant: "destructive",
        title: "Error saving purchase receipt",
        description: "Please try again later.",
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedSupplier = suppliers.find(s => s.id === formData.supplier_id);

  return (
    <div className="min-h-screen bg-background">
      {/* Full-width Header with summary info */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/purchase-receipts')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {isEdit ? 'Edit Purchase Receipt' : 'Create Purchase Receipt'}
                </h1>
                <p className="text-muted-foreground">
                  {isEdit ? 'Update purchase receipt details and items' : 'Create a new purchase order and manage goods receipt'}
                </p>
              </div>
            </div>
            
            {/* Inline Summary for better visibility */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Items:</span>
                <span className="font-semibold text-lg">{items.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Total Qty:</span>
                <span className="font-semibold text-lg">
                  {items.reduce((sum, item) => sum + (item.ordered_quantity || 0), 0)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Total:</span>
                <span className="font-bold text-xl text-primary">${isNaN(formData.total_cost) ? '0.00' : formData.total_cost.toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleSave()} 
                  variant="outline" 
                  size="sm"
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button 
                  onClick={() => handleSave()} 
                  size="sm"
                  disabled={saving}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Save & Approve
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-width Content */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Basic Information - Compact horizontal layout */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              <div className="lg:col-span-2">
                <Label htmlFor="supplier">Supplier *</Label>
                <Select value={formData.supplier_id} onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="order_date">Order Date *</Label>
                <Input
                  type="date"
                  value={formData.order_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, order_date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="expected_date">Expected Date</Label>
                <Input
                  type="date"
                  value={formData.expected_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, expected_date: e.target.value }))}
                />
              </div>

              <div className="md:col-span-2 lg:col-span-4 xl:col-span-6">
                <Label htmlFor="order_notes">Notes</Label>
                <Textarea
                  value={formData.order_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, order_notes: e.target.value }))}
                  placeholder="Add any additional notes or instructions..."
                  className="min-h-[60px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced supplier info if selected */}
        {selectedSupplier && (
          <Card className="bg-muted/30">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedSupplier.name}</span>
                  </div>
                  {selectedSupplier.contact_person && (
                    <span className="text-sm text-muted-foreground">
                      Contact: {selectedSupplier.contact_person}
                    </span>
                  )}
                  {selectedSupplier.phone && (
                    <span className="text-sm text-muted-foreground">
                      {selectedSupplier.phone}
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Supplier Information
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Items Table - Full Width */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Purchase Items ({items.length})
              </CardTitle>
              <div className="flex gap-2">
                <Button onClick={addItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            {items.length === 0 ? (
              <div className="text-center py-12 px-6 text-muted-foreground">
                <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No items added yet</h3>
                <p className="text-sm mb-4">Start building your purchase order by adding items</p>
                <Button onClick={addItem} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Item
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2">
                      <TableHead className="w-[60px] text-center">#</TableHead>
                      <TableHead className="min-w-[320px]">Product Details *</TableHead>
                      <TableHead className="w-[140px] text-center">SKU</TableHead>
                      <TableHead className="w-[130px] text-center">Qty Ordered *</TableHead>
                      <TableHead className="w-[140px] text-center">Unit Cost *</TableHead>
                      <TableHead className="w-[140px] text-center">Total Cost</TableHead>
                      <TableHead className="min-w-[280px]">Order Notes</TableHead>
                      <TableHead className="w-[80px] text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => {
                      const selectedProduct = products.find(p => p.id === item.product_id);
                      return (
                        <TableRow key={index} className="hover:bg-muted/50">
                          <TableCell className="text-center font-medium bg-muted/30">
                            {index + 1}
                          </TableCell>
                          <TableCell className="p-2">
                            <ProductCombobox
                              products={products.map(p => ({
                                id: p.id,
                                name: p.name,
                                sku: p.sku,
                                cost_price: p.cost_price,
                                quantity_on_hand: (p as any).quantity_on_hand,
                                category: (p as any).category
                              }))}
                              value={item.product_id}
                              onSelect={(productId) => updateItem(index, 'product_id', productId)}
                              placeholder="Search products..."
                              showCategory={true}
                            />
                          </TableCell>
                          <TableCell className="text-center p-2">
                            <div className="font-mono text-sm bg-muted/50 rounded px-2 py-1">
                              {selectedProduct?.sku || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              min="1"
                              value={item.ordered_quantity}
                              onChange={(e) => updateItem(index, 'ordered_quantity', parseInt(e.target.value) || 0)}
                              className="w-full text-center font-medium"
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                className="w-full pl-8 text-center font-medium"
                                placeholder="0.00"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="p-2">
                            <div className="text-center font-bold text-lg bg-primary/10 rounded px-2 py-1">
                              ${(item.total_price || 0).toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              value={item.order_notes || ''}
                              onChange={(e) => updateItem(index, 'order_notes', e.target.value)}
                              placeholder="Special instructions, notes..."
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell className="text-center p-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Enhanced Quick Add Section */}
                <div className="mt-6 mx-4 mb-4">
                  <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 border border-dashed border-primary/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        <span className="font-medium text-primary">Quick Product Entry</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Fast way to add products to your order
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <ProductCombobox
                        products={products.map(p => ({
                          id: p.id,
                          name: p.name,
                          sku: p.sku,
                          cost_price: p.cost_price,
                          quantity_on_hand: (p as any).quantity_on_hand,
                          category: (p as any).category
                        }))}
                        value=""
                        onSelect={(productId) => {
                          const newIndex = items.length; // Get index before adding
                          addItem();
                          setTimeout(() => {
                            updateItem(newIndex, 'product_id', productId);
                            // Focus on quantity field for quick entry
                            const quantityInput = document.querySelector(
                              `input[type="number"]:nth-of-type(${(newIndex * 2) + 1})`
                            ) as HTMLInputElement;
                            quantityInput?.focus();
                          }, 100);
                        }}
                        placeholder="🔍 Search and select product to add instantly..."
                        className="w-[400px]"
                        searchPlaceholder="Search products..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatePurchaseReceiptPage;