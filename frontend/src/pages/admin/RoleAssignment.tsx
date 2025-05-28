import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { Role } from '@/types/user';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

const RoleAssignment: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: userService.getAllRoles
  });

  const { data: permissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: userService.getAllPermissions
  });

  const createRoleMutation = useMutation({
    mutationFn: userService.createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsModalOpen(false);
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: userService.updateRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsModalOpen(false);
      setSelectedRole(null);
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: userService.deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    }
  });

  const handleCreateRole = () => {
    setSelectedRole(null);
    setIsModalOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const handleDeleteRole = async (roleId: string) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      await deleteRoleMutation.mutateAsync(roleId);
    }
  };

  const filteredRoles = roles?.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedPermissions = permissions?.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Role Assignment</h1>
        <button
          onClick={handleCreateRole}
          className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Role
        </button>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search roles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center">Loading...</td>
              </tr>
            ) : filteredRoles?.map((role) => (
              <tr key={role.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{role.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500">{role.description}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.map((permission) => (
                      <span
                        key={permission}
                        className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800"
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEditRole(role)}
                    className="text-slate-600 hover:text-slate-900 mr-3"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-6">
              {selectedRole ? 'Edit Role' : 'Create Role'}
            </h2>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const roleData = {
                name: formData.get('name') as string,
                description: formData.get('description') as string,
                permissions: Array.from(formData.getAll('permissions')) as string[]
              };

              if (selectedRole) {
                await updateRoleMutation.mutateAsync({ id: selectedRole.id, ...roleData });
              } else {
                await createRoleMutation.mutateAsync(roleData);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={selectedRole?.name}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    defaultValue={selectedRole?.description}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permissions
                  </label>
                  <div className="space-y-4">
                    {groupedPermissions && Object.entries(groupedPermissions).map(([category, perms]) => (
                      <div key={category} className="border rounded-lg p-4">
                        <h3 className="font-medium text-gray-700 mb-2">{category}</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {perms.map((permission) => (
                            <label key={permission.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                name="permissions"
                                value={permission.name}
                                defaultChecked={selectedRole?.permissions.includes(permission.name)}
                                className="rounded border-gray-300 text-slate-600 focus:ring-slate-500"
                              />
                              <span className="text-sm text-gray-600">{permission.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedRole(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg"
                >
                  {selectedRole ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleAssignment; 