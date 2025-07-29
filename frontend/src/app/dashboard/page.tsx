"use client";

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import ClipLoader from "react-spinners/ClipLoader";
import AddUserModal from '@/components/AddUserModal';
import EditUserModal from '@/components/EditUserModal';

// ==================== INTERFACES ====================
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  status: string;
  profilePicture?: string;
  address?: {
    street: string;
    number: string;
    city: string;
    postalCode: string;
  };
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
}

interface DecodedToken {
  id: string;
  role: string;
  firstName: string;
  lastName: string;
}

// ==================== MAIN COMPONENT ====================
export default function DashboardPage() {
  
  // ==================== STATE ====================
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentUserToEdit, setCurrentUserToEdit] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    status: ''
  });
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0
  });
  const [userRole, setUserRole] = useState<string>('');
  const [loggedInUserName, setLoggedInUserName] = useState<string>('');

  // ==================== HOOKS ====================
  const router = useRouter();

  // ==================== FETCH USERS ====================
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/');
      setLoading(false);
      return;
    }

    try {
      const decodedToken = jwtDecode<DecodedToken>(token);
      setUserRole(decodedToken.role);
      setLoggedInUserName(`${decodedToken.firstName} ${decodedToken.lastName}`);

      const response = await axios.get('http://localhost:5001/api/users', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          page: pagination.currentPage,
          search: searchTerm,
          role: filters.role,
          status: filters.status,
        },
      });

      setUsers(response.data.users);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        totalUsers: response.data.totalUsers,
      });
      setError(null);
    } catch (err) {
      if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
        localStorage.removeItem('token');
        router.push('/');
      } else {
        setError('Error al obtener los usuarios.');
      }
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters.role, filters.status, pagination.currentPage, router]);

  // ==================== EFFECTS ====================
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ==================== EVENT HANDLERS ====================
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({
        ...prev,
        currentPage: newPage
      }));
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('¿Estás seguro?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5001/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        fetchUsers();
      } catch (err) {
        setError('No se pudo eliminar el usuario.');
      }
    }
  };

  const handleEditClick = (user: User) => {
    setCurrentUserToEdit(user);
    setIsEditModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(f => ({
      ...f,
      role: e.target.value
    }));
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(f => ({
      ...f,
      status: e.target.value
    }));
  };

  // ==================== HELPER FUNCTIONS ====================
  const getImageUrl = (profilePicture?: string) => {
    if (!profilePicture) return null;
    return profilePicture.startsWith('http') 
      ? profilePicture 
      : `http://localhost:5001/${profilePicture}`;
  };

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`;
  };

  const getAddressString = (address?: User['address']) => {
    if (!address || !address.street) return 'N/A';
    return `${address.street} ${address.number}`;
  };

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen text-white font-mono">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-cyan-400">
              PANEL DE USUARIOS
            </h1>
            {loggedInUserName && (
              <p className="text-gray-400 text-sm mt-1">
                Sesión iniciada como: {loggedInUserName}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {userRole === 'Admin' && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 font-bold text-black bg-cyan-400 rounded-lg hover:bg-white transition-colors"
              >
                AÑADIR USUARIO
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              CERRAR SESIÓN
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Search Filter */}
          <div>
            <label htmlFor="search-input" className="block text-sm font-bold text-white mb-1 uppercase">
              Buscar
            </label>
            <input
              id="search-input"
              type="text"
              placeholder="Por nombre o email..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          {/* Role Filter */}
          <div>
            <label htmlFor="role-filter" className="block text-sm font-bold text-white mb-1 uppercase">
              Rol
            </label>
            <select
              id="role-filter"
              value={filters.role}
              onChange={handleRoleFilterChange}
              className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <option value="">Todos</option>
              <option value="Admin">Admin</option>
              <option value="User">User</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-bold text-white mb-1 uppercase">
              Estado
            </label>
            <select
              id="status-filter"
              value={filters.status}
              onChange={handleStatusFilterChange}
              className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <option value="">Todos</option>
              <option value="Active">Activo</option>
              <option value="Inactive">Inactivo</option>
            </select>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <ClipLoader color={"#22d3ee"} loading={loading} size={50} />
          </div>
        ) : error ? (
          <p className="text-center text-red-400 mt-8">{error}</p>
        ) : (
          <>
            {/* Users Table */}
            <div className="overflow-x-auto bg-black/50 border-2 border-gray-600 rounded-lg">
              <table className="min-w-full">
                
                {/* Table Header */}
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Foto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Dirección
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Estado
                    </th>
                    {userRole === 'Admin' && (
                      <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-gray-700">
                  {users.map((user) => {
                    const imageUrl = getImageUrl(user.profilePicture);
                    
                    return (
                      <tr key={user._id} className="hover:bg-gray-800">
                        
                        {/* Profile Picture */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {imageUrl ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover border-2 border-cyan-400"
                                src={imageUrl}
                                alt=""
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center font-bold">
                                {getUserInitials(user.firstName, user.lastName)}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Name */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {user.firstName} {user.lastName}
                        </td>

                        {/* Email */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {user.email}
                        </td>

                        {/* Phone */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {user.phoneNumber || 'N/A'}
                        </td>

                        {/* Address */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {getAddressString(user.address)}
                        </td>

                        {/* Role */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {user.role}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-bold rounded-full ${
                              user.status === 'Active'
                                ? 'bg-green-500 text-black'
                                : 'bg-yellow-500 text-black'
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>

                        {/* Actions */}
                        {userRole === 'Admin' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                            <button
                              onClick={() => handleEditClick(user)}
                              className="text-cyan-400 hover:text-white"
                            >
                              EDITAR
                            </button>
                            <button
                              onClick={() => handleDelete(user._id)}
                              className="text-red-500 hover:text-white ml-4"
                            >
                              ELIMINAR
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                className="px-4 py-2 text-sm border-2 border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-800"
              >
                ANTERIOR
              </button>
              
              <div className="text-center">
                <p className="text-sm">
                  PÁGINA {pagination.currentPage} DE {pagination.totalPages}
                </p>
                <p className="text-xs text-gray-400">
                  ({pagination.totalUsers} usuarios en total)
                </p>
              </div>
              
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages}
                className="px-4 py-2 text-sm border-2 border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-800"
              >
                SIGUIENTE
              </button>
            </div>
          </>
        )}

        {/* Modals */}
        {userRole === 'Admin' && (
          <>
            <AddUserModal
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              onUserAdded={fetchUsers}
            />
            <EditUserModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              onUserUpdated={fetchUsers}
              userToEdit={currentUserToEdit}
            />
          </>
        )}
      </div>
    </div>
  );
}