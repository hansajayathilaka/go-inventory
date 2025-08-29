import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Brand } from '../types/api';
import BrandList from '../components/BrandList';
import BrandModal from '../components/BrandModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { api } from '../services/api';

const BrandsPage: React.FC = () => {
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [refreshBrands, setRefreshBrands] = useState(0);

  const handleAddBrand = () => {
    setSelectedBrand(null);
    setShowBrandModal(true);
  };

  const handleEditBrand = (brand: Brand) => {
    setSelectedBrand(brand);
    setShowBrandModal(true);
  };

  const handleViewBrand = (brand: Brand) => {
    // For now, just open edit modal in view mode
    // TODO: Implement dedicated brand view modal with product count and statistics
    setSelectedBrand(brand);
    setShowBrandModal(true);
  };

  const handleDeleteBrand = (brand: Brand) => {
    setSelectedBrand(brand);
    setShowDeleteModal(true);
  };

  const handleBrandSaved = () => {
    setRefreshBrands(prev => prev + 1);
  };

  const confirmDelete = async () => {
    if (!selectedBrand) return;

    try {
      await api.brands.delete(selectedBrand.id);
      setRefreshBrands(prev => prev + 1);
      setShowDeleteModal(false);
      setSelectedBrand(null);
    } catch (error) {
      console.error('Error deleting brand:', error);
      // TODO: Show error notification
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Part Brands</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage vehicle spare part manufacturers and brands. Control which brands appear in product forms and maintain comprehensive brand information.
          </p>
        </div>
        <button
          onClick={handleAddBrand}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Brand
        </button>
      </div>

      {/* Brand List */}
      <BrandList
        key={refreshBrands}
        onEditBrand={handleEditBrand}
        onViewBrand={handleViewBrand}
        onDeleteBrand={handleDeleteBrand}
      />

      {/* Brand Modal */}
      <BrandModal
        isOpen={showBrandModal}
        onClose={() => {
          setShowBrandModal(false);
          setSelectedBrand(null);
        }}
        onSave={handleBrandSaved}
        brand={selectedBrand}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedBrand(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Brand"
        message={`Are you sure you want to delete "${selectedBrand?.name}"? This action cannot be undone and will remove the brand from all associated products. Products using this brand will have their brand association cleared.`}
        confirmButtonText="Delete Brand"
        confirmButtonStyle="danger"
      />
    </div>
  );
};

export default BrandsPage;