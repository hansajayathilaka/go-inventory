import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { VehicleModelWithBrand } from '../types/api';
import VehicleModelList from '../components/VehicleModelList';
import VehicleModelModal from '../components/VehicleModelModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { api } from '../services/api';

const VehicleModelsPage: React.FC = () => {
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
    } catch (error) {
      console.error('Error deleting vehicle model:', error);
      // TODO: Show error notification
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
        <button
          onClick={handleAddVehicleModel}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle Model
        </button>
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedVehicleModel(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Vehicle Model"
        message={
          selectedVehicleModel
            ? `Are you sure you want to delete "${selectedVehicleModel.name}" (${selectedVehicleModel.vehicle_brand.name}, ${formatYearRange(selectedVehicleModel.year_from, selectedVehicleModel.year_to)})? This action cannot be undone and will remove the vehicle model from all associated compatibility records and purchase orders.`
            : 'Are you sure you want to delete this vehicle model?'
        }
        confirmButtonText="Delete Vehicle Model"
        confirmButtonStyle="danger"
      />
    </div>
  );
};

export default VehicleModelsPage;