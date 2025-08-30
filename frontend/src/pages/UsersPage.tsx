import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { User } from '../types/api';
import UserList from '../components/UserList';
import UserModal from '../components/UserModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { api } from '../services/api';

const UsersPage: React.FC = () => {
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [refreshUsers, setRefreshUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddUser = () => {
    setSelectedUser(null);
    setModalMode('create');
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setModalMode('edit');
    setShowUserModal(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setModalMode('view');
    setShowUserModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    setIsLoading(true);
    try {
      const response = await api.delete(`/users/${selectedUser.id}`);
      const data = response.data as any;
      if (data.success) {
        setRefreshUsers(prev => prev + 1);
        setShowDeleteModal(false);
        setSelectedUser(null);
      } else {
        console.error('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalSave = () => {
    setRefreshUsers(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage system users and access permissions.
          </p>
        </div>
        <button
          onClick={handleAddUser}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      {/* User List */}
      <UserList
        onEditUser={handleEditUser}
        onViewUser={handleViewUser}
        onDeleteUser={handleDeleteUser}
        refreshTrigger={refreshUsers}
      />

      {/* User Modal */}
      <UserModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        onSave={handleModalSave}
        user={selectedUser}
        mode={modalMode}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete User"
        message={
          selectedUser
            ? `Are you sure you want to delete the user "${selectedUser.username}"? This action cannot be undone.`
            : ''
        }
        confirmButtonText="Delete User"
        confirmButtonStyle="danger"
        isLoading={isLoading}
      />
    </div>
  );
};

export default UsersPage;