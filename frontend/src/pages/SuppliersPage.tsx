import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Supplier } from '../types/api';
import SupplierList from '../components/SupplierList';
import SupplierModal from '../components/SupplierModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { api } from '../services/api';

const SuppliersPage: React.FC = () => {
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [refreshSuppliers, setRefreshSuppliers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddSupplier = () => {
    setSelectedSupplier(null);
    setModalMode('create');
    setShowSupplierModal(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setModalMode('edit');
    setShowSupplierModal(true);
  };

  const handleViewSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setModalMode('view');
    setShowSupplierModal(true);
  };

  const handleDeleteSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedSupplier) return;

    setIsLoading(true);
    try {
      const response = await api.delete(`/suppliers/${selectedSupplier.id}`);
      const data = response.data as any;
      if (data.success) {
        setRefreshSuppliers(prev => prev + 1);
        setShowDeleteModal(false);
        setSelectedSupplier(null);
      } else {
        console.error('Failed to delete supplier');
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalSave = () => {
    setRefreshSuppliers(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your supplier relationships and contact information.
          </p>
        </div>
        <button
          onClick={handleAddSupplier}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </button>
      </div>

      {/* Supplier List */}
      <SupplierList
        onEditSupplier={handleEditSupplier}
        onViewSupplier={handleViewSupplier}
        onDeleteSupplier={handleDeleteSupplier}
        refreshTrigger={refreshSuppliers}
      />

      {/* Supplier Modal */}
      <SupplierModal
        isOpen={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        onSave={handleModalSave}
        supplier={selectedSupplier}
        mode={modalMode}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Supplier"
        message={
          selectedSupplier
            ? `Are you sure you want to delete the supplier "${selectedSupplier.name}"? This action cannot be undone.`
            : ''
        }
        confirmButtonText="Delete Supplier"
        confirmButtonStyle="danger"
        isLoading={isLoading}
      />
    </div>
  );
};

export default SuppliersPage;