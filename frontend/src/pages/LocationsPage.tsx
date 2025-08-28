import React from 'react';
import { MapPin, Store } from 'lucide-react';

const LocationsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Store Information</h1>
        <p className="mt-1 text-sm text-gray-500">
          Hardware store location details and settings.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Store className="w-8 h-8 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Single Hardware Store</h2>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <MapPin className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
            <div>
              <p className="text-blue-900 font-medium">This system is designed for single-location hardware stores.</p>
              <p className="text-blue-700 text-sm mt-1">
                All inventory is tracked at your primary store location. This simplifies operations 
                and prepares your system for future point-of-sale integration.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Current Setup</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Single store location</li>
              <li>• Simplified inventory tracking</li>
              <li>• POS-ready product management</li>
              <li>• Barcode support for quick lookup</li>
            </ul>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Future POS Integration</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Real-time stock updates from sales</li>
              <li>• Barcode scanning for quick checkout</li>
              <li>• Automatic inventory adjustments</li>
              <li>• Sales reporting integration</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationsPage;