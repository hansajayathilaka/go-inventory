import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Customer } from '../types/api';
import CustomerList from '../components/CustomerList';
import CustomerModal from '../components/CustomerModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { api } from '../services/api';

const CustomersPage: React.FC = () => {
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [refreshCustomers, setRefreshCustomers] = useState(0);

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setShowCustomerModal(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(true);
  };

  const handleViewCustomer = (customer: Customer) => {
    // For now, just open edit modal in view mode
    // TODO: Implement dedicated customer view modal with purchase history
    setSelectedCustomer(customer);
    setShowCustomerModal(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDeleteModal(true);
  };

  const handleCustomerSaved = () => {
    setRefreshCustomers(prev => prev + 1);
  };

  const confirmDelete = async () => {
    if (!selectedCustomer) return;

    try {
      await api.customers.delete(selectedCustomer.id);
      setRefreshCustomers(prev => prev + 1);
      setShowDeleteModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Error deleting customer:', error);
      // TODO: Show error notification
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your customer relationships with comprehensive contact information and purchase history.
          </p>
        </div>
        <button
          onClick={handleAddCustomer}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </button>
      </div>

      {/* Customer List */}
      <CustomerList
        key={refreshCustomers}
        onEditCustomer={handleEditCustomer}
        onViewCustomer={handleViewCustomer}
        onDeleteCustomer={handleDeleteCustomer}
      />

      {/* Customer Modal */}
      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => {
          setShowCustomerModal(false);
          setSelectedCustomer(null);
        }}
        onSave={handleCustomerSaved}
        customer={selectedCustomer}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedCustomer(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete "${selectedCustomer?.name}"? This action cannot be undone and will remove all customer data including purchase history.`}
        confirmButtonText="Delete Customer"
        confirmButtonStyle="danger"
      />
    </div>
  );
};

export default CustomersPage;