import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, DollarSign, Loader, ArrowLeft } from 'lucide-react';
import type { Product, Category, Supplier, Brand, ApiResponse } from '../types/api';
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
import { useToast } from '@/hooks/use-toast';

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

const ProductCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

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


  // Auto-generate SKU based on name
  const generateSKU = useCallback((name: string) => {
    if (!name.trim()) return '';
    
    // Extract first 3-4 meaningful words and create abbreviation
    const words = name.trim().toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .slice(0, 3);
    
    const abbreviation = words.map(word => word.substring(0, 3)).join('');
    const timestamp = Date.now().toString().slice(-3);
    
    return `${abbreviation}${timestamp}`;
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/categories');
      const data = extractListData<Category>(response);
      setCategories(data.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      toast({
        variant: "destructive",
        title: "Error loading categories",
        description: "Please try refreshing the page.",
      });
    }
  }, [toast]);

  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await api.get('/suppliers');
      const data = extractListData<Supplier>(response);
      setSuppliers((data.data || []).filter(s => s.is_active));
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      toast({
        variant: "destructive",
        title: "Error loading suppliers",
        description: "Please try refreshing the page.",
      });
    }
  }, [toast]);

  const fetchBrands = useCallback(async () => {
    try {
      const brands = await api.brands.getActive();
      setBrands((brands as Brand[] || []).filter((b: Brand) => b.is_active));
    } catch (err) {
      console.error('Error fetching brands:', err);
      toast({
        variant: "destructive",
        title: "Error loading brands",
        description: "Please try refreshing the page.",
      });
    }
  }, [toast]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchCategories(), 
          fetchSuppliers(), 
          fetchBrands()
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchCategories, fetchSuppliers, fetchBrands]);

  // Auto-generate SKU when name changes
  useEffect(() => {
    if (formData.name && !formData.sku) {
      setFormData(prev => ({
        ...prev,
        sku: generateSKU(formData.name)
      }));
    }
  }, [formData.name, formData.sku, generateSKU]);

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
      // Validate that the selected category exists in the categories list
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
    
    if (!validateForm()) {
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

      const response = await api.post<ApiResponse<Product>>('/products', cleanData);

      if (response.data.success) {
        toast({
          title: "Product created",
          description: `"${formData.name}" has been created successfully.`,
        });
        
        // Option 1: Navigate back to products page
        navigate('/products');
        
        // Option 2: Navigate to edit page to add vehicle compatibility
        // navigate(`/products/edit/${response.data.data.id}`);
      } else {
        setErrors({ submit: response.data.message || 'Failed to create product' });
      }
    } catch (err: unknown) {
      console.error('Error creating product:', err);
      const apiError = err as { response?: { data?: { message?: string; errors?: Record<string, string> } } };
      if (apiError.response?.data?.message) {
        setErrors({ submit: apiError.response.data.message });
      } else if (apiError.response?.data?.errors) {
        setErrors(apiError.response.data.errors);
      } else {
        setErrors({ submit: 'Failed to create product. Please try again.' });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading form data...</span>
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
              Create New Product
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Add a new product to your inventory catalog
            </p>
          </div>
        </div>
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
              Enter the basic details for the new product
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
                  placeholder="Enter or auto-generated SKU"
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
              Categorize the product with supplier and brand information
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
              Set cost, retail, and wholesale pricing
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
              Optional product specifications and identifiers
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
          
          <div className="flex space-x-2">
            <Button
              type="submit"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Product'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductCreatePage;