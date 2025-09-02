import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { VehicleCompatibilityWithDetails } from '../types/api';
import CompatibilityList from '../components/CompatibilityList';
import CompatibilityModal from '../components/CompatibilityModal';
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

const CompatibilitiesPage: React.FC = () => {
  const { toast } = useToast();
  const [showCompatibilityModal, setShowCompatibilityModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCompatibility, setSelectedCompatibility] = useState<VehicleCompatibilityWithDetails | null>(null);
  const [refreshCompatibilities, setRefreshCompatibilities] = useState(0);

  const handleAddCompatibility = () => {
    setSelectedCompatibility(null);
    setShowCompatibilityModal(true);
  };

  const handleEditCompatibility = (compatibility: VehicleCompatibilityWithDetails) => {
    setSelectedCompatibility(compatibility);
    setShowCompatibilityModal(true);
  };

  const handleViewCompatibility = (compatibility: VehicleCompatibilityWithDetails) => {
    // For now, just open edit modal in view mode
    // TODO: Implement dedicated compatibility view modal with detailed information and history
    setSelectedCompatibility(compatibility);
    setShowCompatibilityModal(true);
  };

  const handleDeleteCompatibility = (compatibility: VehicleCompatibilityWithDetails) => {
    setSelectedCompatibility(compatibility);
    setShowDeleteModal(true);
  };

  const handleCompatibilitySaved = () => {
    setRefreshCompatibilities(prev => prev + 1);
  };

  const confirmDelete = async () => {
    if (!selectedCompatibility) return;

    try {
      await api.vehicleCompatibilities.delete(selectedCompatibility.id);
      setRefreshCompatibilities(prev => prev + 1);
      setShowDeleteModal(false);
      setSelectedCompatibility(null);
      toast({
        title: "Compatibility deleted",
        description: "The vehicle compatibility has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting compatibility:', error);
      toast({
        title: "Error",
        description: "Failed to delete compatibility. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Format product info for display
  const formatProductInfo = (compatibility: VehicleCompatibilityWithDetails) => {
    if (!compatibility.product) return 'Unknown Product';
    return `${compatibility.product.name} (${compatibility.product.sku})`;
  };

  // Format vehicle model info for display
  const formatVehicleModelInfo = (compatibility: VehicleCompatibilityWithDetails) => {
    if (!compatibility.vehicle_model) return 'Unknown Vehicle Model';
    const vehicleModel = compatibility.vehicle_model as import('../types/api').VehicleModelWithBrand;
    if (!vehicleModel.vehicle_brand) return compatibility.vehicle_model.name || 'Unknown Vehicle Model';
    const brand = vehicleModel.vehicle_brand.name;
    const model = compatibility.vehicle_model.name;
    return `${brand} ${model}`;
  };

  // Format year range for display
  const formatYearRange = (compatibility: VehicleCompatibilityWithDetails) => {
    if (compatibility.year_from && compatibility.year_to) {
      return `${compatibility.year_from}-${compatibility.year_to}`;
    } else if (compatibility.year_from) {
      return `${compatibility.year_from}+`;
    } else if (compatibility.year_to) {
      return `Up to ${compatibility.year_to}`;
    }
    return 'All years';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vehicle Compatibilities</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage product-vehicle compatibility relationships. Define which products are compatible with specific vehicle models and years for accurate parts matching and inventory management.
          </p>
        </div>
        <Button onClick={handleAddCompatibility}>
          <Plus className="h-4 w-4 mr-2" />
          Add Compatibility
        </Button>
      </div>

      {/* Compatibility List */}
      <CompatibilityList
        key={refreshCompatibilities}
        onEditCompatibility={handleEditCompatibility}
        onViewCompatibility={handleViewCompatibility}
        onDeleteCompatibility={handleDeleteCompatibility}
      />

      {/* Compatibility Modal */}
      <CompatibilityModal
        isOpen={showCompatibilityModal}
        onClose={() => {
          setShowCompatibilityModal(false);
          setSelectedCompatibility(null);
        }}
        onSave={handleCompatibilitySaved}
        compatibility={selectedCompatibility}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle Compatibility</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCompatibility
                ? `Are you sure you want to delete the compatibility between "${formatProductInfo(selectedCompatibility)}" and "${formatVehicleModelInfo(selectedCompatibility)}" (${formatYearRange(selectedCompatibility)})? This action cannot be undone and will permanently remove this compatibility relationship.`
                : 'Are you sure you want to delete this compatibility?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedCompatibility(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Compatibility
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CompatibilitiesPage;