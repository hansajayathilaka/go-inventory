import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Package, DollarSign, Loader, Car, Plus, Trash2, CheckCircle, AlertCircle, ArrowLeft, Save } from 'lucide-react';
import type { Product, Category, Supplier, Brand, VehicleCompatibilityWithDetails, VehicleModelWithBrand, VehicleBrand, CreateVehicleCompatibilityRequest, ApiResponse } from '../types/api';
import { api, extractListData } from '../services/api';
import { SearchableTreeSelect } from '../components/SearchableTreeSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ProductFormData {
  sku: string;
  name: string;
  description: string;
  category_id: string;
  supplier_id: string;
  brand_id: string;
  cost_price: number;
  retail_price: number;
  wholesale_price?: number;
  barcode?: string;
  weight?: number;
  dimensions?: string;
  is_active: boolean;
}

const ProductEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    sku: '',
    name: '',
    description: '',
    category_id: '',
    supplier_id: '',
    brand_id: '',
    cost_price: 0,
    retail_price: 0,
    wholesale_price: 0,
    barcode: '',
    weight: 0,
    dimensions: '',
    is_active: true
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Vehicle compatibility states
  const [compatibilities, setCompatibilities] = useState<VehicleCompatibilityWithDetails[]>([]);
  const [vehicleBrands, setVehicleBrands] = useState<VehicleBrand[]>([]);
  const [vehicleModels, setVehicleModels] = useState<VehicleModelWithBrand[]>([]);
  const [showCompatibilityForm, setShowCompatibilityForm] = useState(false);
  const [newCompatibility, setNewCompatibility] = useState<CreateVehicleCompatibilityRequest>({
    product_id: '',
    vehicle_model_id: '',
    year_from: new Date().getFullYear(),
    year_to: undefined,
    notes: ''
  });
  const [deleteCompatibilityId, setDeleteCompatibilityId] = useState<string | null>(null);

  const fetchProduct = useCallback(async (productId: string) => {
    try {
      const response = await api.get(`/products/${productId}`) as { data: ApiResponse<Product> };
      if (response.data.success) {
        const productData = response.data.data;
        setProduct(productData);
        setFormData({
          sku: productData.sku,
          name: productData.name,
          description: productData.description,
          category_id: productData.category_id,
          supplier_id: productData.supplier_id || '',
          brand_id: productData.brand_id || '',
          cost_price: productData.cost_price,
          retail_price: productData.retail_price,
          wholesale_price: productData.wholesale_price || 0,
          barcode: productData.barcode || '',
          weight: productData.weight || 0,
          dimensions: productData.dimensions || '',
          is_active: productData.is_active
        });
        setNewCompatibility(prev => ({ ...prev, product_id: productData.id }));
      } else {
        throw new Error(response.data.message || 'Failed to load product');
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      toast({
        variant: "destructive",
        title: "Error loading product",
        description: "The product could not be loaded. Please try again.",
      });
      navigate('/products');
    }
  }, [toast, navigate]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/categories');
      const data = extractListData<Category>(response);
      setCategories(data.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await api.get('/suppliers');
      const data = extractListData<Supplier>(response);
      setSuppliers((data.data || []).filter(s => s.is_active));
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      const brands = await api.brands.getActive();
      setBrands((brands as Brand[] || []).filter((b: Brand) => b.is_active));
    } catch (err) {
      console.error('Error fetching brands:', err);
    }
  }, []);

  const fetchVehicleBrands = useCallback(async () => {
    try {
      const vehicleBrands = await api.vehicleBrands.getActive();
      setVehicleBrands((vehicleBrands as VehicleBrand[] || []).filter((b: VehicleBrand) => b.is_active));
    } catch (err) {
      console.error('Error fetching vehicle brands:', err);
    }
  }, []);

  const fetchVehicleModels = useCallback(async () => {
    try {
      const vehicleModels = await api.vehicleModels.getActive();
      setVehicleModels((vehicleModels as VehicleModelWithBrand[] || []).filter((m: VehicleModelWithBrand) => m.is_active));
    } catch (err) {
      console.error('Error fetching vehicle models:', err);
    }
  }, []);

  const fetchCompatibilities = useCallback(async (productId: string) => {
    try {
      const response = await api.vehicleCompatibilities.list({ 
        product_id: productId,
        limit: 100 
      });
      if (response.data.success) {
        setCompatibilities(response.data.data.data);
      }
    } catch (err) {
      console.error('Error fetching compatibilities:', err);
    }
  }, []);

  useEffect(() => {
    if (!id) {
      navigate('/products');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchProduct(id),
          fetchCategories(),
          fetchSuppliers(),
          fetchBrands(),
          fetchVehicleBrands(),
          fetchVehicleModels()
        ]);
        
        // Load compatibilities after product is loaded
        if (id) {
          await fetchCompatibilities(id);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, fetchProduct, fetchCategories, fetchSuppliers, fetchBrands, fetchVehicleBrands, fetchVehicleModels, fetchCompatibilities, navigate]);

  // Auto-calculate wholesale price (midpoint between cost and retail)
  useEffect(() => {
    if (formData.cost_price && formData.retail_price && formData.retail_price > formData.cost_price) {
      const calculatedWholesale = (formData.cost_price + formData.retail_price) / 2;
      setFormData(prev => ({
        ...prev,
        wholesale_price: Math.round(calculatedWholesale * 100) / 100
      }));
    }
  }, [formData.cost_price, formData.retail_price]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    } else {
      const categoryExists = categories.some(cat => cat.id === formData.category_id);
      if (!categoryExists) {
        newErrors.category_id = 'Selected category is not valid';
      }
    }

    if (!formData.supplier_id) {
      newErrors.supplier_id = 'Supplier is required';
    }

    if (formData.cost_price <= 0) {
      newErrors.cost_price = 'Cost price must be greater than 0';
    }

    if (formData.retail_price <= 0) {
      newErrors.retail_price = 'Retail price must be greater than 0';
    }

    if (formData.retail_price <= formData.cost_price) {
      newErrors.retail_price = 'Retail price must be greater than cost price';
    }

    if (formData.wholesale_price && formData.wholesale_price < formData.cost_price) {
      newErrors.wholesale_price = 'Wholesale price cannot be less than cost price';
    }

    if (formData.wholesale_price && formData.wholesale_price > formData.retail_price) {
      newErrors.wholesale_price = 'Wholesale price cannot be greater than retail price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !product) {
      return;
    }

    setSaving(true);
    try {
      // Clean up form data
      const cleanData = {
        ...formData,
        cost_price: Number(formData.cost_price),
        retail_price: Number(formData.retail_price),
        wholesale_price: formData.wholesale_price ? Number(formData.wholesale_price) : undefined,
        weight: formData.weight || undefined,
        dimensions: formData.dimensions?.trim() || undefined,
        barcode: formData.barcode?.trim() || undefined
      };

      const response = await api.put<ApiResponse<Product>>(`/products/${product.id}`, cleanData);

      if (response.data.success) {
        toast({
          title: "Product updated",
          description: `"${formData.name}" has been updated successfully.`,
        });
        navigate('/products');
      } else {
        setErrors({ submit: response.data.message || 'Failed to update product' });
      }
    } catch (err: unknown) {
      console.error('Error updating product:', err);
      const apiError = err as { response?: { data?: { message?: string; errors?: Record<string, string> } } };
      if (apiError.response?.data?.message) {
        setErrors({ submit: apiError.response.data.message });
      } else if (apiError.response?.data?.errors) {
        setErrors(apiError.response.data.errors);
      } else {
        setErrors({ submit: 'Failed to update product. Please try again.' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    field: keyof ProductFormData,
    value: string | number | boolean
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Vehicle compatibility management functions
  const handleAddCompatibility = async () => {
    if (!product?.id) return;

    try {
      const compatibilityData = {
        ...newCompatibility,
        product_id: product.id
      };

      const response = await api.vehicleCompatibilities.create(compatibilityData);
      if (response.data.success) {
        // Refresh compatibilities list
        await fetchCompatibilities(product.id);
        
        // Reset form
        setNewCompatibility({
          product_id: product.id,
          vehicle_model_id: '',
          year_from: new Date().getFullYear(),
          year_to: undefined,
          notes: ''
        });
        setShowCompatibilityForm(false);
        
        toast({
          title: "Compatibility added",
          description: "Vehicle compatibility has been added successfully.",
        });
      }
    } catch (err) {
      console.error('Error adding compatibility:', err);
      toast({
        variant: "destructive",
        title: "Error adding compatibility",
        description: "Please try again.",
      });
    }
  };

  const handleDeleteCompatibility = async (compatibilityId: string) => {
    if (!product?.id) return;

    try {
      await api.vehicleCompatibilities.delete(compatibilityId);
      // Refresh compatibilities list
      await fetchCompatibilities(product.id);
      setDeleteCompatibilityId(null);
      
      toast({
        title: "Compatibility removed",
        description: "Vehicle compatibility has been removed successfully.",
      });
    } catch (err) {
      console.error('Error deleting compatibility:', err);
      toast({
        variant: "destructive",
        title: "Error removing compatibility",
        description: "Please try again.",
      });
    }
  };

  const handleCompatibilityChange = (
    field: keyof CreateVehicleCompatibilityRequest,
    value: string | number | undefined
  ) => {
    setNewCompatibility(prev => ({ ...prev, [field]: value }));
  };

  // Get filtered vehicle models by brand
  const getVehicleModelsByBrand = (brandId: string) => {
    return vehicleModels.filter(model => model.vehicle_brand_id === brandId);
  };

  // Format vehicle model display
  const formatVehicleModel = (model: VehicleModelWithBrand) => {
    const yearRange = model.year_to && model.year_to !== model.year_from 
      ? `${model.year_from}-${model.year_to}` 
      : `${model.year_from}+`;
    return `${model.vehicle_brand.name} ${model.name} (${yearRange})`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading product data...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert variant="destructive">
          <AlertDescription>Product not found or could not be loaded.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/products')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center">
              <Package className="h-6 w-6 mr-3 text-primary" />
              Edit Product
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Update product details and manage vehicle compatibility
            </p>
          </div>
        </div>
        <Badge variant={formData.is_active ? "default" : "secondary"}>
          {formData.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Error Message */}
        {errors.submit && (
          <Alert variant="destructive">
            <AlertDescription>{errors.submit}</AlertDescription>
          </Alert>
        )}

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update the basic details for this product
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter product name"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  placeholder="Enter SKU"
                  className={errors.sku ? 'border-destructive' : ''}
                />
                {errors.sku && (
                  <p className="text-sm text-destructive">{errors.sku}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter product description"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Classification */}
        <Card>
          <CardHeader>
            <CardTitle>Classification</CardTitle>
            <CardDescription>
              Update product category, supplier and brand information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <SearchableTreeSelect
                  categories={categories}
                  selectedValue={formData.category_id || null}
                  onChange={(categoryId: string | null) => handleInputChange('category_id', categoryId || '')}
                  placeholder="Select a category"
                  searchable={true}
                  searchPlaceholder="Search categories..."
                  showProductCounts={true}
                  showConnectionLines={true}
                  maxHeight={300}
                  allowClear={true}
                  error={errors.category_id}
                  disabled={loading}
                  className="w-full"
                  ariaLabel="Select product category"
                />
                {errors.category_id && (
                  <p className="text-sm text-destructive">{errors.category_id}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier *</Label>
                <Select value={formData.supplier_id} onValueChange={(value) => handleInputChange('supplier_id', value)}>
                  <SelectTrigger className={errors.supplier_id ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name} ({supplier.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.supplier_id && (
                  <p className="text-sm text-destructive">{errors.supplier_id}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Select value={formData.brand_id} onValueChange={(value) => handleInputChange('brand_id', value)}>
                  <SelectTrigger className={errors.brand_id ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select a brand (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name} ({brand.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.brand_id && (
                  <p className="text-sm text-destructive">{errors.brand_id}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Select the manufacturer/brand (e.g., Bosch, NGK, Castrol)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>
              Update cost, retail, and wholesale pricing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost_price">Cost Price * ($)</Label>
                <Input
                  id="cost_price"
                  type="number"
                  value={formData.cost_price || ''}
                  onChange={(e) => handleInputChange('cost_price', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className={errors.cost_price ? 'border-destructive' : ''}
                />
                {errors.cost_price && (
                  <p className="text-sm text-destructive">{errors.cost_price}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="retail_price">Retail Price * ($)</Label>
                <Input
                  id="retail_price"
                  type="number"
                  value={formData.retail_price || ''}
                  onChange={(e) => handleInputChange('retail_price', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className={errors.retail_price ? 'border-destructive' : ''}
                />
                {errors.retail_price && (
                  <p className="text-sm text-destructive">{errors.retail_price}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="wholesale_price">Wholesale Price ($)</Label>
                <Input
                  id="wholesale_price"
                  type="number"
                  value={formData.wholesale_price || ''}
                  onChange={(e) => handleInputChange('wholesale_price', parseFloat(e.target.value) || 0)}
                  placeholder="Auto-calculated"
                  step="0.01"
                  min="0"
                  className={errors.wholesale_price ? 'border-destructive' : ''}
                />
                {errors.wholesale_price && (
                  <p className="text-sm text-destructive">{errors.wholesale_price}</p>
                )}
              </div>
            </div>

            {/* Pricing Info */}
            {formData.cost_price > 0 && formData.retail_price > formData.cost_price && (
              <Alert>
                <DollarSign className="h-4 w-4" />
                <AlertDescription>
                  Margin: ${(formData.retail_price - formData.cost_price).toFixed(2)} 
                  ({(((formData.retail_price - formData.cost_price) / formData.cost_price) * 100).toFixed(1)}%)
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
            <CardDescription>
              Update product specifications and identifiers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  value={formData.barcode || ''}
                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                  placeholder="Enter barcode"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (lbs)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight || ''}
                  onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                  placeholder="0.0"
                  step="0.1"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dimensions">Dimensions</Label>
                <Input
                  id="dimensions"
                  value={formData.dimensions || ''}
                  onChange={(e) => handleInputChange('dimensions', e.target.value)}
                  placeholder="L x W x H"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Product Status</CardTitle>
            <CardDescription>
              Set the availability status for this product
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked === true)}
              />
              <Label htmlFor="is_active">Product is active and available for sale</Label>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Compatibility */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Car className="h-5 w-5 mr-2 text-primary" />
                  Vehicle Compatibility
                </CardTitle>
                <CardDescription>
                  Define which vehicles this part is compatible with
                </CardDescription>
              </div>
              <Button
                type="button"
                onClick={() => setShowCompatibilityForm(true)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Compatibility
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Compatibilities */}
            <div className="space-y-3">
              {compatibilities.length === 0 ? (
                <Alert>
                  <Car className="h-4 w-4" />
                  <AlertDescription>
                    No vehicle compatibilities defined yet. Click "Add Compatibility" to specify which vehicles this part fits.
                  </AlertDescription>
                </Alert>
              ) : (
                compatibilities.map((compatibility) => (
                  <div
                    key={compatibility.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {compatibility.vehicle_model && formatVehicleModel(compatibility.vehicle_model as VehicleModelWithBrand)}
                        </span>
                        <div title={compatibility.is_verified ? "Verified compatibility" : "Unverified compatibility"}>
                          {compatibility.is_verified ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                      </div>
                      {compatibility.year_from && (
                        <div className="text-sm text-muted-foreground">
                          Years: {compatibility.year_from}{compatibility.year_to && compatibility.year_to !== compatibility.year_from ? `-${compatibility.year_to}` : '+'}
                        </div>
                      )}
                      {compatibility.notes && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {compatibility.notes}
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteCompatibilityId(compatibility.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Add New Compatibility Form */}
            {showCompatibilityForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Vehicle Compatibility</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vehicle_model">Vehicle Model *</Label>
                      <Select
                        value={newCompatibility.vehicle_model_id}
                        onValueChange={(value) => handleCompatibilityChange('vehicle_model_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a vehicle model" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicleBrands.map((brand) => {
                            const models = getVehicleModelsByBrand(brand.id);
                            return models.length > 0 ? (
                              <optgroup key={brand.id} label={brand.name}>
                                {models.map((model) => (
                                  <SelectItem key={model.id} value={model.id}>
                                    {formatVehicleModel(model)}
                                  </SelectItem>
                                ))}
                              </optgroup>
                            ) : null;
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="year_from">Year From</Label>
                        <Input
                          id="year_from"
                          type="number"
                          value={newCompatibility.year_from || ''}
                          onChange={(e) => handleCompatibilityChange('year_from', parseInt(e.target.value) || undefined)}
                          placeholder="2020"
                          min="1900"
                          max={new Date().getFullYear() + 5}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="year_to">Year To</Label>
                        <Input
                          id="year_to"
                          type="number"
                          value={newCompatibility.year_to || ''}
                          onChange={(e) => handleCompatibilityChange('year_to', parseInt(e.target.value) || undefined)}
                          placeholder="2025 (optional)"
                          min="1900"
                          max={new Date().getFullYear() + 5}
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-2 space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Input
                        id="notes"
                        value={newCompatibility.notes || ''}
                        onChange={(e) => handleCompatibilityChange('notes', e.target.value)}
                        placeholder="Optional notes about this compatibility"
                      />
                    </div>

                    <div className="lg:col-span-2 flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCompatibilityForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleAddCompatibility}
                        disabled={!newCompatibility.vehicle_model_id}
                      >
                        Add Compatibility
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/products')}
            disabled={saving}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Delete Compatibility Confirmation Dialog */}
      <AlertDialog open={!!deleteCompatibilityId} onOpenChange={() => setDeleteCompatibilityId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Vehicle Compatibility</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this vehicle compatibility? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteCompatibilityId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCompatibilityId && handleDeleteCompatibility(deleteCompatibilityId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductEditPage;