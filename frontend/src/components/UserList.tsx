import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Users, 
  Mail, 
  Shield,
  Grid,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  Clock
} from 'lucide-react';
import type { User, UserListResponse } from '../types/api';
import { api } from '../services/api';

interface UserListProps {
  onEditUser: (user: User) => void;
  onViewUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
  refreshTrigger?: number;
}

type ViewMode = 'grid' | 'table';
type RoleFilter = 'all' | 'admin' | 'manager' | 'staff' | 'viewer';

const UserList: React.FC<UserListProps> = ({
  onEditUser,
  onViewUser,
  onDeleteUser,
  refreshTrigger = 0,
}) => {
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  
  const itemsPerPage = 12;

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      
      const response = await api.get<UserListResponse>(`/users?${params}`);
      const data = response.data as any; // The response is wrapped in success/data structure
      
      if (data.success && data.data) {
        setUsers(Array.isArray(data.data) ? data.data : []);
        if (data.pagination) {
          setTotalPages(data.pagination.total_pages || 1);
          setTotalUsers(data.pagination.total || 0);
        }
      } else {
        setError('Failed to fetch users');
        setUsers([]);
      }
    } catch (err) {
      setError('Error loading users. Please try again.');
      setUsers([]);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter, refreshTrigger]);

  // Handlers
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value as RoleFilter);
    setCurrentPage(1);
  };

  // Role badge styling
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'staff':
        return 'bg-green-100 text-green-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-card text-card-foreground shadow rounded-lg">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card text-card-foreground shadow rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div>
            <h3 className="text-lg font-medium text-foreground">
              Users ({totalUsers})
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage system users and permissions
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${
                viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-muted-foreground hover:text-muted-foreground'
              }`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md ${
                viewMode === 'table'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-muted-foreground hover:text-muted-foreground'
              }`}
            >
              <ListIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 bg-muted/50 border-b border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={handleRoleFilterChange}
            className="px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {error ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">
              <Users className="mx-auto h-12 w-12" />
            </div>
            <p className="text-muted-foreground">{error}</p>
            <button
              onClick={fetchUsers}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Try again
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-foreground">No users found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchTerm ? 'Try adjusting your search criteria.' : 'No users available.'}
            </p>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground truncate">
                          {user.username}
                        </h4>
                        <div className="mt-1 flex items-center text-sm text-muted-foreground">
                          <Mail className="h-4 w-4 mr-1" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeStyle(user.role)}`}>
                            <Shield className="h-3 w-3 mr-1" />
                            {user.role}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          Last login: {formatDate(user.last_login || '')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Created: {formatDate(user.created_at)}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onViewUser(user)}
                          className="text-muted-foreground hover:text-blue-600 transition-colors"
                          title="View user"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEditUser(user)}
                          className="text-muted-foreground hover:text-green-600 transition-colors"
                          title="Edit user"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {user.username !== 'admin' && (
                          <button
                            onClick={() => onDeleteUser(user)}
                            className="text-muted-foreground hover:text-red-600 transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Table View */}
            {viewMode === 'table' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card text-card-foreground divide-y divide-border">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {user.username}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeStyle(user.role)}`}>
                            <Shield className="h-3 w-3 mr-1" />
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {formatDate(user.last_login || '')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => onViewUser(user)}
                              className="text-muted-foreground hover:text-blue-600 transition-colors"
                              title="View user"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onEditUser(user)}
                              className="text-muted-foreground hover:text-green-600 transition-colors"
                              title="Edit user"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {user.username !== 'admin' && (
                              <button
                                onClick={() => onDeleteUser(user)}
                                className="text-muted-foreground hover:text-red-600 transition-colors"
                                title="Delete user"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 bg-muted/50 border-t border-border rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-input rounded-md hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-input rounded-md hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;