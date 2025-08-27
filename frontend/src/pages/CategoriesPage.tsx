import React from 'react';
import { FolderTree, Plus } from 'lucide-react';

const CategoriesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="mt-1 text-sm text-gray-500">
            Organize your products into hierarchical categories.
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </button>
      </div>

      {/* Content */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="text-center py-12">
            <FolderTree className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Category Management (React Version)
            </h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              This will be rebuilt using React components with the same functionality as the 
              previous Templ + HTMX version, but with better developer experience and maintainability.
            </p>
            <div className="mt-6 space-y-2">
              <div className="text-sm text-green-600">✅ Hierarchical tree view</div>
              <div className="text-sm text-green-600">✅ Real-time category loading</div>
              <div className="text-sm text-green-600">✅ Create/edit/delete modals</div>
              <div className="text-sm text-green-600">✅ Parent category selection</div>
              <div className="text-sm text-green-600">✅ Search and filtering</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;