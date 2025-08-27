import React from 'react';
import { Truck } from 'lucide-react';

const SuppliersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your supplier relationships.</p>
      </div>
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="text-center py-12">
            <Truck className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Supplier Management</h3>
            <p className="mt-2 text-sm text-gray-500">Coming soon in Phase D.2</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuppliersPage;