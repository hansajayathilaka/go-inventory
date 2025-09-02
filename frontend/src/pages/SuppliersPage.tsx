import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Supplier } from '../types/api';
import SupplierList from '../components/SupplierList';
import SupplierModal from '../components/SupplierModal';
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

const SuppliersPage: React.FC = () => {
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [refreshSuppliers, setRefreshSuppliers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
      const data = response.data as { success: boolean; message?: string };
      if (data.success) {
        setRefreshSuppliers(prev => prev + 1);
        setShowDeleteModal(false);
        setSelectedSupplier(null);
        toast({
          title: "Supplier deleted",
          description: `${selectedSupplier.name} has been successfully removed.`,
        });
      } else {
        console.error('Failed to delete supplier');
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete supplier. Please try again.",
        });
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete supplier. Please try again.",
      });
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
          <h1 className="text-2xl font-bold text-foreground">Suppliers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your supplier relationships and contact information.
          </p>
        </div>
        <Button onClick={handleAddSupplier}>
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedSupplier
                ? `Are you sure you want to delete the supplier "${selectedSupplier.name}"? This action cannot be undone.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteModal(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete Supplier"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SuppliersPage;