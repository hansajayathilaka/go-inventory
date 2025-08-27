import React from 'react';
import { FileText } from 'lucide-react';

const AuditPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-gray-500">Track all system activities and changes.</p>
      </div>
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="text-center py-12">
            <FileText className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Audit Trail</h3>
            <p className="mt-2 text-sm text-gray-500">Coming soon - comprehensive activity logging</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditPage;