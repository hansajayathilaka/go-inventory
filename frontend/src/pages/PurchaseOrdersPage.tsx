import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { PurchaseOrder } from '../types/api';
import PurchaseOrderList from '../components/PurchaseOrderList';
import PurchaseOrderModal from '../components/PurchaseOrderModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { api } from '../services/api';

const PurchaseOrdersPage: React.FC = () => {
  const [showPurchaseOrderModal, setShowPurchaseOrderModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [refreshPurchaseOrders, setRefreshPurchaseOrders] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddPurchaseOrder = () => {
    setSelectedPurchaseOrder(null);
    setShowPurchaseOrderModal(true);
  };

  const handleEditPurchaseOrder = (purchaseOrder: PurchaseOrder) => {
    setSelectedPurchaseOrder(purchaseOrder);
    setShowPurchaseOrderModal(true);
  };

  const handleViewPurchaseOrder = (purchaseOrder: PurchaseOrder) => {
    // For now, just open edit modal in view mode
    // TODO: Implement dedicated purchase order view modal with full details
    setSelectedPurchaseOrder(purchaseOrder);
    setShowPurchaseOrderModal(true);
  };

  const handleDeletePurchaseOrder = (purchaseOrder: PurchaseOrder) => {
    setSelectedPurchaseOrder(purchaseOrder);
    setShowDeleteModal(true);
  };

  const handleApprovePurchaseOrder = (purchaseOrder: PurchaseOrder) => {
    setSelectedPurchaseOrder(purchaseOrder);
    setShowApproveModal(true);
  };

  const handleSendPurchaseOrder = (purchaseOrder: PurchaseOrder) => {
    setSelectedPurchaseOrder(purchaseOrder);
    setShowSendModal(true);
  };

  const handleCancelPurchaseOrder = (purchaseOrder: PurchaseOrder) => {
    setSelectedPurchaseOrder(purchaseOrder);
    setShowCancelModal(true);
  };

  const handlePurchaseOrderSaved = () => {
    setRefreshPurchaseOrders(prev => prev + 1);
  };

  const confirmDelete = async () => {
    if (!selectedPurchaseOrder || isLoading) return;

    try {
      setIsLoading(true);
      await api.purchaseOrders.delete(selectedPurchaseOrder.id);
      setRefreshPurchaseOrders(prev => prev + 1);
      setShowDeleteModal(false);
      setSelectedPurchaseOrder(null);
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      // TODO: Show error notification
    } finally {
      setIsLoading(false);
    }
  };

  const confirmApprove = async () => {
    if (!selectedPurchaseOrder || isLoading) return;

    try {
      setIsLoading(true);
      await api.purchaseOrders.approve(selectedPurchaseOrder.id);
      setRefreshPurchaseOrders(prev => prev + 1);
      setShowApproveModal(false);
      setSelectedPurchaseOrder(null);
    } catch (error) {
      console.error('Error approving purchase order:', error);
      // TODO: Show error notification
    } finally {
      setIsLoading(false);
    }
  };

  const confirmSend = async () => {
    if (!selectedPurchaseOrder || isLoading) return;

    try {
      setIsLoading(true);
      await api.purchaseOrders.send(selectedPurchaseOrder.id);
      setRefreshPurchaseOrders(prev => prev + 1);
      setShowSendModal(false);
      setSelectedPurchaseOrder(null);
    } catch (error) {
      console.error('Error sending purchase order:', error);
      // TODO: Show error notification
    } finally {
      setIsLoading(false);
    }
  };

  const confirmCancel = async () => {
    if (!selectedPurchaseOrder || isLoading) return;

    try {
      setIsLoading(true);
      await api.purchaseOrders.cancel(selectedPurchaseOrder.id);
      setRefreshPurchaseOrders(prev => prev + 1);
      setShowCancelModal(false);
      setSelectedPurchaseOrder(null);
    } catch (error) {
      console.error('Error cancelling purchase order:', error);
      // TODO: Show error notification
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage purchase orders from draft creation to goods receipt with comprehensive workflow tracking.
          </p>
        </div>
        <button
          onClick={handleAddPurchaseOrder}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Purchase Order
        </button>
      </div>

      {/* Purchase Order List */}
      <PurchaseOrderList
        key={refreshPurchaseOrders}
        onEditPurchaseOrder={handleEditPurchaseOrder}
        onViewPurchaseOrder={handleViewPurchaseOrder}
        onDeletePurchaseOrder={handleDeletePurchaseOrder}
        onApprovePurchaseOrder={handleApprovePurchaseOrder}
        onSendPurchaseOrder={handleSendPurchaseOrder}
        onCancelPurchaseOrder={handleCancelPurchaseOrder}
      />

      {/* Purchase Order Modal */}
      <PurchaseOrderModal
        isOpen={showPurchaseOrderModal}
        onClose={() => {
          setShowPurchaseOrderModal(false);
          setSelectedPurchaseOrder(null);
        }}
        onSave={handlePurchaseOrderSaved}
        purchaseOrder={selectedPurchaseOrder}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedPurchaseOrder(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Purchase Order"
        message={
          selectedPurchaseOrder ? (
            <div className="space-y-2">
              <p>
                Are you sure you want to delete purchase order{' '}
                <span className="font-medium">{selectedPurchaseOrder.po_number}</span>?
              </p>
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600">Total Amount:</p>
                    <p className="font-medium">
                      {formatCurrency(selectedPurchaseOrder.total_amount, selectedPurchaseOrder.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status:</p>
                    <p className="font-medium capitalize">{selectedPurchaseOrder.status}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Items:</p>
                    <p className="font-medium">{selectedPurchaseOrder.items?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Order Date:</p>
                    <p className="font-medium">
                      {new Date(selectedPurchaseOrder.order_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-red-600 text-sm font-medium">
                This action cannot be undone.
              </p>
            </div>
          ) : (
            'Are you sure you want to delete this purchase order?'
          )
        }
        confirmLabel="Delete"
        confirmVariant="danger"
        isLoading={isLoading}
      />

      {/* Approve Confirmation Modal */}
      <ConfirmationModal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setSelectedPurchaseOrder(null);
        }}
        onConfirm={confirmApprove}
        title="Approve Purchase Order"
        message={
          selectedPurchaseOrder ? (
            <div className="space-y-2">
              <p>
                Are you sure you want to approve purchase order{' '}
                <span className="font-medium">{selectedPurchaseOrder.po_number}</span>?
              </p>
              <div className="bg-blue-50 p-3 rounded-lg text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600">Total Amount:</p>
                    <p className="font-medium">
                      {formatCurrency(selectedPurchaseOrder.total_amount, selectedPurchaseOrder.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Items:</p>
                    <p className="font-medium">{selectedPurchaseOrder.items?.length || 0}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600">Expected Date:</p>
                    <p className="font-medium">
                      {selectedPurchaseOrder.expected_date 
                        ? new Date(selectedPurchaseOrder.expected_date).toLocaleDateString()
                        : 'Not specified'
                      }
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-blue-600 text-sm">
                Once approved, this purchase order will be ready to be sent to the supplier.
              </p>
            </div>
          ) : (
            'Are you sure you want to approve this purchase order?'
          )
        }
        confirmLabel="Approve"
        confirmVariant="primary"
        isLoading={isLoading}
      />

      {/* Send Confirmation Modal */}
      <ConfirmationModal
        isOpen={showSendModal}
        onClose={() => {
          setShowSendModal(false);
          setSelectedPurchaseOrder(null);
        }}
        onConfirm={confirmSend}
        title="Send Purchase Order"
        message={
          selectedPurchaseOrder ? (
            <div className="space-y-2">
              <p>
                Are you sure you want to send purchase order{' '}
                <span className="font-medium">{selectedPurchaseOrder.po_number}</span>{' '}
                to the supplier?
              </p>
              <div className="bg-green-50 p-3 rounded-lg text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600">Total Amount:</p>
                    <p className="font-medium">
                      {formatCurrency(selectedPurchaseOrder.total_amount, selectedPurchaseOrder.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Items:</p>
                    <p className="font-medium">{selectedPurchaseOrder.items?.length || 0}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600">Expected Delivery:</p>
                    <p className="font-medium">
                      {selectedPurchaseOrder.expected_date 
                        ? new Date(selectedPurchaseOrder.expected_date).toLocaleDateString()
                        : 'Not specified'
                      }
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-green-600 text-sm">
                This will change the status to "Ordered" and the order will be tracked for delivery.
              </p>
            </div>
          ) : (
            'Are you sure you want to send this purchase order to the supplier?'
          )
        }
        confirmLabel="Send Order"
        confirmVariant="success"
        isLoading={isLoading}
      />

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedPurchaseOrder(null);
        }}
        onConfirm={confirmCancel}
        title="Cancel Purchase Order"
        message={
          selectedPurchaseOrder ? (
            <div className="space-y-2">
              <p>
                Are you sure you want to cancel purchase order{' '}
                <span className="font-medium">{selectedPurchaseOrder.po_number}</span>?
              </p>
              <div className="bg-red-50 p-3 rounded-lg text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600">Current Status:</p>
                    <p className="font-medium capitalize">{selectedPurchaseOrder.status}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Amount:</p>
                    <p className="font-medium">
                      {formatCurrency(selectedPurchaseOrder.total_amount, selectedPurchaseOrder.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Items:</p>
                    <p className="font-medium">{selectedPurchaseOrder.items?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Order Date:</p>
                    <p className="font-medium">
                      {new Date(selectedPurchaseOrder.order_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-red-600 text-sm font-medium">
                {selectedPurchaseOrder.status === 'ordered' 
                  ? 'Warning: This order may have already been sent to the supplier. Please confirm with the supplier before cancelling.'
                  : 'This will permanently cancel the purchase order.'
                }
              </p>
            </div>
          ) : (
            'Are you sure you want to cancel this purchase order?'
          )
        }
        confirmLabel="Cancel Order"
        confirmVariant="danger"
        isLoading={isLoading}
      />
    </div>
  );
};

export default PurchaseOrdersPage;