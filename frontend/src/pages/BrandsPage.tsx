import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Brand } from '../types/api';
import BrandList from '../components/BrandList';
import BrandModal from '../components/BrandModal';
import { api } from '../services/api';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';

const BrandsPage: React.FC = () => {
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [refreshBrands, setRefreshBrands] = useState(0);
  const { toast } = useToast();

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
      toast({
        title: "Brand deleted",
        description: `${selectedBrand.name} has been successfully removed.`,
      });
    } catch (error) {
      console.error('Error deleting brand:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete brand. Please try again.",
      });
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
        <Button onClick={handleAddBrand}>
          <Plus className="h-4 w-4 mr-2" />
          Add Brand
        </Button>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Brand</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedBrand?.name}"? This action cannot be undone and will remove the brand from all associated products. Products using this brand will have their brand association cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteModal(false);
              setSelectedBrand(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Brand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BrandsPage;