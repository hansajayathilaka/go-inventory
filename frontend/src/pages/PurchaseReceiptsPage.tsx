import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { PurchaseReceipt } from '../types/api';
import PurchaseReceiptList from '../components/PurchaseReceiptList';
import PurchaseReceiptModal from '../components/PurchaseReceiptModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { api } from '../services/api';

const PurchaseReceiptsPage: React.FC = () => {
  const [showPurchaseReceiptModal, setShowPurchaseReceiptModal] = useState(false);
  const [modalMode, setModalMode] = useState<'order' | 'receive' | 'view'>('order');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedPurchaseReceipt, setSelectedPurchaseReceipt] = useState<PurchaseReceipt | null>(null);
  const [refreshPurchaseReceipts, setRefreshPurchaseReceipts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddPurchaseReceipt = () => {
    setSelectedPurchaseReceipt(null);
    setModalMode('order');
    setShowPurchaseReceiptModal(true);
  };

  const handleEditPurchaseReceipt = (purchaseReceipt: PurchaseReceipt) => {
    setSelectedPurchaseReceipt(purchaseReceipt);
    // Determine mode based on status
    if (purchaseReceipt.status === 'received' || purchaseReceipt.status === 'partial') {
      setModalMode('receive');
    } else {
      setModalMode('order');
    }
    setShowPurchaseReceiptModal(true);
  };

  const handleViewPurchaseReceipt = (purchaseReceipt: PurchaseReceipt) => {
    setSelectedPurchaseReceipt(purchaseReceipt);
    setModalMode('view');
    setShowPurchaseReceiptModal(true);
  };

  const handleDeletePurchaseReceipt = (purchaseReceipt: PurchaseReceipt) => {
    setSelectedPurchaseReceipt(purchaseReceipt);
    setShowDeleteModal(true);
  };

  const handleApprovePurchaseReceipt = (purchaseReceipt: PurchaseReceipt) => {
    setSelectedPurchaseReceipt(purchaseReceipt);
    setShowApproveModal(true);
  };

  const handleSendPurchaseReceipt = (purchaseReceipt: PurchaseReceipt) => {
    setSelectedPurchaseReceipt(purchaseReceipt);
    setShowSendModal(true);
  };

  const handleReceivePurchaseReceipt = (purchaseReceipt: PurchaseReceipt) => {
    setSelectedPurchaseReceipt(purchaseReceipt);
    setModalMode('receive');
    setShowPurchaseReceiptModal(true);
  };

  const handleCompletePurchaseReceipt = (purchaseReceipt: PurchaseReceipt) => {
    setSelectedPurchaseReceipt(purchaseReceipt);
    setShowCompleteModal(true);
  };

  const handleCancelPurchaseReceipt = (purchaseReceipt: PurchaseReceipt) => {
    setSelectedPurchaseReceipt(purchaseReceipt);
    setShowCancelModal(true);
  };

  const handlePurchaseReceiptSaved = () => {
    setRefreshPurchaseReceipts(prev => prev + 1);
  };

  const confirmDelete = async () => {
    if (!selectedPurchaseReceipt || isLoading) return;

    try {
      setIsLoading(true);
      await api.purchaseReceipts.delete(selectedPurchaseReceipt.id);
      setRefreshPurchaseReceipts(prev => prev + 1);
      setShowDeleteModal(false);
      setSelectedPurchaseReceipt(null);
    } catch (error) {
      console.error('Error deleting purchase receipt:', error);
      // TODO: Show error notification
    } finally {
      setIsLoading(false);
    }
  };

  const confirmApprove = async () => {
    if (!selectedPurchaseReceipt || isLoading) return;

    try {
      setIsLoading(true);
      await api.purchaseReceipts.approve(selectedPurchaseReceipt.id);
      setRefreshPurchaseReceipts(prev => prev + 1);
      setShowApproveModal(false);
      setSelectedPurchaseReceipt(null);
    } catch (error) {
      console.error('Error approving purchase receipt:', error);
      // TODO: Show error notification
    } finally {
      setIsLoading(false);
    }
  };

  const confirmSend = async () => {
    if (!selectedPurchaseReceipt || isLoading) return;

    try {
      setIsLoading(true);
      await api.purchaseReceipts.send(selectedPurchaseReceipt.id);
      setRefreshPurchaseReceipts(prev => prev + 1);
      setShowSendModal(false);
      setSelectedPurchaseReceipt(null);
    } catch (error) {
      console.error('Error sending purchase receipt:', error);
      // TODO: Show error notification
    } finally {
      setIsLoading(false);
    }
  };

  const confirmReceive = async () => {
    if (!selectedPurchaseReceipt || isLoading) return;

    try {
      setIsLoading(true);
      // For basic receive operation, we'll just call the receive API
      // The detailed receipt processing will be done in the modal
      await api.purchaseReceipts.receive(selectedPurchaseReceipt.id, {
        received_date: new Date().toISOString().split('T')[0],
        quality_check: false,
      });
      setRefreshPurchaseReceipts(prev => prev + 1);
      setShowReceiveModal(false);
      setSelectedPurchaseReceipt(null);
    } catch (error) {
      console.error('Error processing receipt:', error);
      // TODO: Show error notification
    } finally {
      setIsLoading(false);
    }
  };

  const confirmComplete = async () => {
    if (!selectedPurchaseReceipt || isLoading) return;

    try {
      setIsLoading(true);
      await api.purchaseReceipts.complete(selectedPurchaseReceipt.id);
      setRefreshPurchaseReceipts(prev => prev + 1);
      setShowCompleteModal(false);
      setSelectedPurchaseReceipt(null);
    } catch (error) {
      console.error('Error completing purchase receipt:', error);
      // TODO: Show error notification
    } finally {
      setIsLoading(false);
    }
  };

  const confirmCancel = async () => {
    if (!selectedPurchaseReceipt || isLoading) return;

    try {
      setIsLoading(true);
      await api.purchaseReceipts.cancel(selectedPurchaseReceipt.id);
      setRefreshPurchaseReceipts(prev => prev + 1);
      setShowCancelModal(false);
      setSelectedPurchaseReceipt(null);
    } catch (error) {
      console.error('Error cancelling purchase receipt:', error);
      // TODO: Show error notification
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Receipts</h1>
          <p className="text-gray-600 mt-1">
            Unified purchase order and goods receipt management
          </p>
        </div>
        <button
          onClick={handleAddPurchaseReceipt}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Create Purchase Receipt
        </button>
      </div>

      {/* Purchase Receipt List */}
      <PurchaseReceiptList
        key={refreshPurchaseReceipts} // Force refresh when this changes
        onEditPurchaseReceipt={handleEditPurchaseReceipt}
        onViewPurchaseReceipt={handleViewPurchaseReceipt}
        onDeletePurchaseReceipt={handleDeletePurchaseReceipt}
        onApprovePurchaseReceipt={handleApprovePurchaseReceipt}
        onSendPurchaseReceipt={handleSendPurchaseReceipt}
        onReceivePurchaseReceipt={handleReceivePurchaseReceipt}
        onCompletePurchaseReceipt={handleCompletePurchaseReceipt}
        onCancelPurchaseReceipt={handleCancelPurchaseReceipt}
      />

      {/* Purchase Receipt Modal */}
      {showPurchaseReceiptModal && (
        <PurchaseReceiptModal
          isOpen={showPurchaseReceiptModal}
          onClose={() => setShowPurchaseReceiptModal(false)}
          onSave={handlePurchaseReceiptSaved}
          purchaseReceipt={selectedPurchaseReceipt}
          mode={modalMode}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          title="Delete Purchase Receipt"
          message={`Are you sure you want to delete purchase receipt "${selectedPurchaseReceipt?.receipt_number}"? This action cannot be undone.`}
          confirmButtonText="Delete"
          confirmButtonStyle="danger"
          isLoading={isLoading}
        />
      )}

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <ConfirmationModal
          isOpen={showApproveModal}
          onClose={() => setShowApproveModal(false)}
          onConfirm={confirmApprove}
          title="Approve Purchase Receipt"
          message={`Are you sure you want to approve purchase receipt "${selectedPurchaseReceipt?.receipt_number}"? Once approved, it can be sent to the supplier.`}
          confirmButtonText="Approve"
          confirmButtonStyle="primary"
          isLoading={isLoading}
        />
      )}

      {/* Send Confirmation Modal */}
      {showSendModal && (
        <ConfirmationModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          onConfirm={confirmSend}
          title="Send Purchase Receipt to Supplier"
          message={`Are you sure you want to send purchase receipt "${selectedPurchaseReceipt?.receipt_number}" to the supplier? The order will be marked as sent and awaiting delivery.`}
          confirmButtonText="Send"
          confirmButtonStyle="primary"
          isLoading={isLoading}
        />
      )}

      {/* Receive Confirmation Modal */}
      {showReceiveModal && (
        <ConfirmationModal
          isOpen={showReceiveModal}
          onClose={() => setShowReceiveModal(false)}
          onConfirm={confirmReceive}
          title="Process Goods Receipt"
          message={`Are you sure you want to process the receipt for "${selectedPurchaseReceipt?.receipt_number}"? This will mark the goods as received and allow detailed receipt processing.`}
          confirmButtonText="Process Receipt"
          confirmButtonStyle="primary"
          isLoading={isLoading}
        />
      )}

      {/* Complete Confirmation Modal */}
      {showCompleteModal && (
        <ConfirmationModal
          isOpen={showCompleteModal}
          onClose={() => setShowCompleteModal(false)}
          onConfirm={confirmComplete}
          title="Complete Purchase Receipt"
          message={`Are you sure you want to complete purchase receipt "${selectedPurchaseReceipt?.receipt_number}"? This will finalize the receipt and update inventory levels.`}
          confirmButtonText="Complete"
          confirmButtonStyle="primary"
          isLoading={isLoading}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <ConfirmationModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={confirmCancel}
          title="Cancel Purchase Receipt"
          message={`Are you sure you want to cancel purchase receipt "${selectedPurchaseReceipt?.receipt_number}"? This action cannot be undone and will cancel the entire order.`}
          confirmButtonText="Cancel Order"
          confirmButtonStyle="danger"
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default PurchaseReceiptsPage;