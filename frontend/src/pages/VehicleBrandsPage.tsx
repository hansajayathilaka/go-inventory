import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { VehicleBrand } from '../types/api';
import VehicleBrandList from '../components/VehicleBrandList';
import VehicleBrandModal from '../components/VehicleBrandModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { api } from '../services/api';

const VehicleBrandsPage: React.FC = () => {
  const [showVehicleBrandModal, setShowVehicleBrandModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVehicleBrand, setSelectedVehicleBrand] = useState<VehicleBrand | null>(null);
  const [refreshVehicleBrands, setRefreshVehicleBrands] = useState(0);

  const handleAddVehicleBrand = () => {
    setSelectedVehicleBrand(null);
    setShowVehicleBrandModal(true);
  };

  const handleEditVehicleBrand = (vehicleBrand: VehicleBrand) => {
    setSelectedVehicleBrand(vehicleBrand);
    setShowVehicleBrandModal(true);
  };

  const handleViewVehicleBrand = (vehicleBrand: VehicleBrand) => {
    // For now, just open edit modal in view mode
    // TODO: Implement dedicated vehicle brand view modal with vehicle model count and statistics
    setSelectedVehicleBrand(vehicleBrand);
    setShowVehicleBrandModal(true);
  };

  const handleDeleteVehicleBrand = (vehicleBrand: VehicleBrand) => {
    setSelectedVehicleBrand(vehicleBrand);
    setShowDeleteModal(true);
  };

  const handleVehicleBrandSaved = () => {
    setRefreshVehicleBrands(prev => prev + 1);
  };

  const confirmDelete = async () => {
    if (!selectedVehicleBrand) return;

    try {
      await api.vehicleBrands.delete(selectedVehicleBrand.id);
      setRefreshVehicleBrands(prev => prev + 1);
      setShowDeleteModal(false);
      setSelectedVehicleBrand(null);
    } catch (error) {
      console.error('Error deleting vehicle brand:', error);
      // TODO: Show error notification
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Brands</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage vehicle manufacturers and automotive brands. Control which vehicle brands appear in vehicle model forms and maintain comprehensive manufacturer information.
          </p>
        </div>
        <button
          onClick={handleAddVehicleBrand}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle Brand
        </button>
      </div>

      {/* Vehicle Brand List */}
      <VehicleBrandList
        key={refreshVehicleBrands}
        onEditVehicleBrand={handleEditVehicleBrand}
        onViewVehicleBrand={handleViewVehicleBrand}
        onDeleteVehicleBrand={handleDeleteVehicleBrand}
      />

      {/* Vehicle Brand Modal */}
      <VehicleBrandModal
        isOpen={showVehicleBrandModal}
        onClose={() => {
          setShowVehicleBrandModal(false);
          setSelectedVehicleBrand(null);
        }}
        onSave={handleVehicleBrandSaved}
        vehicleBrand={selectedVehicleBrand}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedVehicleBrand(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Vehicle Brand"
        message={`Are you sure you want to delete "${selectedVehicleBrand?.name}"? This action cannot be undone and will remove the vehicle brand from all associated vehicle models. Vehicle models using this brand will have their brand association cleared.`}
        confirmButtonText="Delete Vehicle Brand"
        confirmButtonStyle="danger"
      />
    </div>
  );
};

export default VehicleBrandsPage;