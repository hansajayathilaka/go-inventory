import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { VehicleModelWithBrand } from '../types/api';
import VehicleModelList from '../components/VehicleModelList';
import VehicleModelModal from '../components/VehicleModelModal';
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

const VehicleModelsPage: React.FC = () => {
  const { toast } = useToast();
  const [showVehicleModelModal, setShowVehicleModelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVehicleModel, setSelectedVehicleModel] = useState<VehicleModelWithBrand | null>(null);
  const [refreshVehicleModels, setRefreshVehicleModels] = useState(0);

  const handleAddVehicleModel = () => {
    setSelectedVehicleModel(null);
    setShowVehicleModelModal(true);
  };

  const handleEditVehicleModel = (vehicleModel: VehicleModelWithBrand) => {
    setSelectedVehicleModel(vehicleModel);
    setShowVehicleModelModal(true);
  };

  const handleViewVehicleModel = (vehicleModel: VehicleModelWithBrand) => {
    // For now, just open edit modal in view mode
    // TODO: Implement dedicated vehicle model view modal with compatibility information and statistics
    setSelectedVehicleModel(vehicleModel);
    setShowVehicleModelModal(true);
  };

  const handleDeleteVehicleModel = (vehicleModel: VehicleModelWithBrand) => {
    setSelectedVehicleModel(vehicleModel);
    setShowDeleteModal(true);
  };

  const handleVehicleModelSaved = () => {
    setRefreshVehicleModels(prev => prev + 1);
  };

  const confirmDelete = async () => {
    if (!selectedVehicleModel) return;

    try {
      await api.vehicleModels.delete(selectedVehicleModel.id);
      setRefreshVehicleModels(prev => prev + 1);
      setShowDeleteModal(false);
      setSelectedVehicleModel(null);
      toast({
        title: "Vehicle model deleted",
        description: `${selectedVehicleModel.name} has been successfully deleted.`,
      });
    } catch (error) {
      console.error('Error deleting vehicle model:', error);
      toast({
        title: "Error",
        description: "Failed to delete vehicle model. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Format year range for display
  const formatYearRange = (yearFrom: number, yearTo?: number) => {
    if (yearTo && yearTo !== yearFrom) {
      return `${yearFrom}-${yearTo}`;
    }
    return `${yearFrom}+`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Models</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage vehicle models and their specifications. Define model details, production years, engine types, and compatibility information for accurate spare parts matching.
          </p>
        </div>
        <Button onClick={handleAddVehicleModel}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle Model
        </Button>
      </div>

      {/* Vehicle Model List */}
      <VehicleModelList
        key={refreshVehicleModels}
        onEditVehicleModel={handleEditVehicleModel}
        onViewVehicleModel={handleViewVehicleModel}
        onDeleteVehicleModel={handleDeleteVehicleModel}
      />

      {/* Vehicle Model Modal */}
      <VehicleModelModal
        isOpen={showVehicleModelModal}
        onClose={() => {
          setShowVehicleModelModal(false);
          setSelectedVehicleModel(null);
        }}
        onSave={handleVehicleModelSaved}
        vehicleModel={selectedVehicleModel}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle Model</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedVehicleModel
                ? `Are you sure you want to delete "${selectedVehicleModel.name}" (${selectedVehicleModel.vehicle_brand.name}, ${formatYearRange(selectedVehicleModel.year_from, selectedVehicleModel.year_to)})? This action cannot be undone and will remove the vehicle model from all associated compatibility records and purchase orders.`
                : 'Are you sure you want to delete this vehicle model?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedVehicleModel(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Vehicle Model
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VehicleModelsPage;