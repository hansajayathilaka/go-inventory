import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { PurchaseReceipt } from '../types/api';
import PurchaseReceiptList from '../components/PurchaseReceiptList';
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

const PurchaseReceiptsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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
    navigate('/purchase-receipts/create');
  };

  const handleEditPurchaseReceipt = (purchaseReceipt: PurchaseReceipt) => {
    navigate(`/purchase-receipts/edit/${purchaseReceipt.id}`);
  };

  const handleViewPurchaseReceipt = (purchaseReceipt: PurchaseReceipt) => {
    navigate(`/purchase-receipts/view/${purchaseReceipt.id}`);
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
    navigate(`/purchase-receipts/receive/${purchaseReceipt.id}`);
  };

  const handleCompletePurchaseReceipt = (purchaseReceipt: PurchaseReceipt) => {
    setSelectedPurchaseReceipt(purchaseReceipt);
    setShowCompleteModal(true);
  };

  const handleCancelPurchaseReceipt = (purchaseReceipt: PurchaseReceipt) => {
    setSelectedPurchaseReceipt(purchaseReceipt);
    setShowCancelModal(true);
  };


  const confirmDelete = async () => {
    if (!selectedPurchaseReceipt || isLoading) return;

    try {
      setIsLoading(true);
      await api.purchaseReceipts.delete(selectedPurchaseReceipt.id);
      setRefreshPurchaseReceipts(prev => prev + 1);
      setShowDeleteModal(false);
      setSelectedPurchaseReceipt(null);
      toast({
        title: "Purchase receipt deleted",
        description: `"${selectedPurchaseReceipt.receipt_number}" has been deleted successfully.`,
      });
    } catch (error) {
      console.error('Error deleting purchase receipt:', error);
      toast({
        variant: "destructive",
        title: "Error deleting purchase receipt",
        description: "Please try again later.",
      });
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Purchase Receipts</h1>
          <p className="text-muted-foreground mt-1">
            Unified purchase order and goods receipt management
          </p>
        </div>
        <Button onClick={handleAddPurchaseReceipt}>
          <Plus className="h-4 w-4 mr-2" />
          Create Purchase Receipt
        </Button>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Receipt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete purchase receipt "{selectedPurchaseReceipt?.receipt_number}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteModal(false);
              setSelectedPurchaseReceipt(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Purchase Receipt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve purchase receipt "{selectedPurchaseReceipt?.receipt_number}"? Once approved, it can be sent to the supplier.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowApproveModal(false);
              setSelectedPurchaseReceipt(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmApprove} disabled={isLoading}>
              {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>}
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Confirmation Modal */}
      {showSendModal && (
        <ConfirmationDialog
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
        <ConfirmationDialog
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
        <ConfirmationDialog
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
        <ConfirmationDialog
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