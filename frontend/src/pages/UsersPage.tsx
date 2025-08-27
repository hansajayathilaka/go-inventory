import React from 'react';
import { Users } from 'lucide-react';

const UsersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="mt-1 text-sm text-gray-500">User management and access control.</p>
      </div>
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="text-center py-12">
            <Users className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">User Management</h3>
            <p className="mt-2 text-sm text-gray-500">Single user system - no additional users needed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;