import React from 'react';
import { MapPin } from 'lucide-react';

const LocationsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
        <p className="mt-1 text-sm text-gray-500">Manage storage locations and warehouses.</p>
      </div>
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="text-center py-12">
            <MapPin className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Location Management</h3>
            <p className="mt-2 text-sm text-gray-500">Coming soon in Phase D.2</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationsPage;