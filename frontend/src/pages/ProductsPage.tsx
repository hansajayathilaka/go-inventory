import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Product } from '../types/api';
import ProductList from '../components/ProductList';
import ProductModal from '../components/ProductModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { api } from '../services/api';

const ProductsPage: React.FC = () => {
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [refreshProducts, setRefreshProducts] = useState(0);

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleViewProduct = (product: Product) => {
    // For now, just open edit modal in view mode
    // TODO: Implement dedicated product view modal
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const handleProductSaved = () => {
    setRefreshProducts(prev => prev + 1);
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;

    try {
      await api.delete(`/products/${selectedProduct.id}`);
      setRefreshProducts(prev => prev + 1);
      setShowDeleteModal(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      // TODO: Show error notification
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your product catalog with comprehensive search and filtering capabilities.
          </p>
        </div>
        <button
          onClick={handleAddProduct}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </button>
      </div>

      {/* Product List */}
      <ProductList
        key={refreshProducts}
        onEditProduct={handleEditProduct}
        onViewProduct={handleViewProduct}
        onDeleteProduct={handleDeleteProduct}
      />

      {/* Product Modal */}
      <ProductModal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setSelectedProduct(null);
        }}
        onSave={handleProductSaved}
        product={selectedProduct}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedProduct(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
        confirmButtonText="Delete"
        confirmButtonStyle="danger"
      />
    </div>
  );
};

export default ProductsPage;