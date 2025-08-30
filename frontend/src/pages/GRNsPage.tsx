import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { GRN } from '../types/api';
import GRNList from '../components/GRNList';
import GRNModal from '../components/GRNModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { api } from '../services/api';

const GRNsPage: React.FC = () => {
  const [showGRNModal, setShowGRNModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState<GRN | null>(null);
  const [processAction, setProcessAction] = useState<'receipt' | 'verify' | 'complete'>('receipt');
  const [refreshGRNs, setRefreshGRNs] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddGRN = () => {
    setSelectedGRN(null);
    setShowGRNModal(true);
  };

  const handleEditGRN = (grn: GRN) => {
    setSelectedGRN(grn);
    setShowGRNModal(true);
  };

  const handleViewGRN = (grn: GRN) => {
    // For now, just open edit modal in view mode
    // TODO: Implement dedicated GRN view modal with full details
    setSelectedGRN(grn);
    setShowGRNModal(true);
  };

  const handleDeleteGRN = (grn: GRN) => {
    setSelectedGRN(grn);
    setShowDeleteModal(true);
  };

  const handleProcessGRN = (grn: GRN, action: 'receipt' | 'verify' | 'complete') => {
    setSelectedGRN(grn);
    setProcessAction(action);
    setShowProcessModal(true);
  };

  const handleGRNSaved = () => {
    setRefreshGRNs(prev => prev + 1);
  };

  const confirmDelete = async () => {
    if (!selectedGRN) return;

    try {
      setIsLoading(true);
      await api.grn.delete(selectedGRN.id);
      setShowDeleteModal(false);
      setSelectedGRN(null);
      handleGRNSaved();
    } catch (error: any) {
      console.error('Failed to delete GRN:', error);
      alert(error.response?.data?.message || 'Failed to delete GRN');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmProcess = async () => {
    if (!selectedGRN) return;

    try {
      setIsLoading(true);
      
      switch (processAction) {
        case 'receipt':
          await api.grn.receipt(selectedGRN.id);
          break;
        case 'verify':
          await api.grn.verify(selectedGRN.id);
          break;
        case 'complete':
          await api.grn.complete(selectedGRN.id);
          break;
      }
      
      setShowProcessModal(false);
      setSelectedGRN(null);
      handleGRNSaved();
    } catch (error: any) {
      console.error(`Failed to ${processAction} GRN:`, error);
      alert(error.response?.data?.message || `Failed to ${processAction} GRN`);
    } finally {
      setIsLoading(false);
    }
  };

  const getProcessModalTitle = () => {
    switch (processAction) {
      case 'receipt':
        return 'Mark as Received';
      case 'verify':
        return 'Verify Quality';
      case 'complete':
        return 'Complete GRN';
      default:
        return 'Process GRN';
    }
  };

  const getProcessModalMessage = () => {
    if (!selectedGRN) return '';

    switch (processAction) {
      case 'receipt':
        return `Are you sure you want to mark GRN "${selectedGRN.grn_number}" as received? This will change the status from draft to received.`;
      case 'verify':
        return `Are you sure you want to verify the quality for GRN "${selectedGRN.grn_number}"? This will indicate that quality control has been completed.`;
      case 'complete':
        return `Are you sure you want to complete GRN "${selectedGRN.grn_number}"? This will finalize the goods receipt process and update inventory levels.`;
      default:
        return `Are you sure you want to process GRN "${selectedGRN.grn_number}"?`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">GRN Management</h1>
          <p className="text-gray-600">Manage goods received notes and quality control processes</p>
        </div>
        <button
          onClick={handleAddGRN}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus size={20} />
          Create GRN
        </button>
      </div>

      {/* GRN List */}
      <GRNList
        key={refreshGRNs}
        onEditGRN={handleEditGRN}
        onViewGRN={handleViewGRN}
        onDeleteGRN={handleDeleteGRN}
        onProcessGRN={handleProcessGRN}
      />

      {/* GRN Modal */}
      <GRNModal
        isOpen={showGRNModal}
        onClose={() => {
          setShowGRNModal(false);
          setSelectedGRN(null);
        }}
        onSave={handleGRNSaved}
        grn={selectedGRN}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedGRN(null);
        }}
        onConfirm={confirmDelete}
        title="Delete GRN"
        message={
          selectedGRN
            ? `Are you sure you want to delete GRN "${selectedGRN.grn_number}"? This action cannot be undone.`
            : ''
        }
        confirmButtonText="Delete"
        confirmButtonStyle="danger"
        isLoading={isLoading}
      />

      {/* Process Confirmation Modal */}
      <ConfirmationModal
        isOpen={showProcessModal}
        onClose={() => {
          setShowProcessModal(false);
          setSelectedGRN(null);
        }}
        onConfirm={confirmProcess}
        title={getProcessModalTitle()}
        message={getProcessModalMessage()}
        confirmButtonText={getProcessModalTitle()}
        confirmButtonStyle="primary"
        isLoading={isLoading}
      />
    </div>
  );
};

export default GRNsPage;