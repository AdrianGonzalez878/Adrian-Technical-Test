"use client";

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import ClipLoader from "react-spinners/ClipLoader";
import AddUserModal from '@/components/AddUserModal';
import EditUserModal from '@/components/EditUserModal';

// Interfaces y tipos
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

interface Filters {
  role: string;
  status: string;
}

export default function DashboardPage() {
  // Estados principales
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de modales
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [currentUserToEdit, setCurrentUserToEdit] = useState<User | null>(null);

  // Estados de filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filters, setFilters] = useState<Filters>({
    role: '',
    status: ''
  });

  // Estados de paginación y usuario
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0
  });
  const [userRole, setUserRole] = useState<string>('');
  const [loggedInUserName, setLoggedInUserName] = useState<string>('');

  // Hooks
  const router = useRouter();

  // Función principal para obtener usuarios
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      setLoading(false);
      return;
    }

    try {
      // Decodificar token para obtener información del usuario
      const decodedToken = jwtDecode<DecodedToken>(token);
      setUserRole(decodedToken.role);
      setLoggedInUserName(`${decodedToken.firstName} ${decodedToken.lastName}`);

      // Realizar petición a la API
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

      // Actualizar estados con la respuesta
      setUsers(response.data.users);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        totalUsers: response.data.totalUsers,
      });
      setError(null);

    } catch (err) {
      if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
        // Token inválido o expirado
        localStorage.removeItem('token');
        router.push('/');
      } else {
        setError('Error al obtener los usuarios.');
      }
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters.role, filters.status, pagination.currentPage, router]);

  // Effect para cargar usuarios cuando cambien las dependencias
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Manejadores de eventos
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({
        ...prev,
        currentPage: newPage
      }));
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5001/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        fetchUsers(); // Recargar la lista después de eliminar
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
    // Resetear a la primera página cuando se busque
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleFilterChange = (filterType: keyof Filters) => (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: e.target.value
    }));
    // Resetear a la primera página cuando se filtre
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Manejadores de modales
  const handleOpenAddModal = () => setIsAddModalOpen(true);
  const handleCloseAddModal = () => setIsAddModalOpen(false);
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentUserToEdit(null);
  };

  // Función para generar URL de imagen
  const getImageUrl = (profilePicture?: string) => {
    if (!profilePicture) return null;
    return profilePicture.startsWith('http') 
      ? profilePicture 
      : `http://localhost:5001/${profilePicture}`;
  };

  // Función para generar iniciales
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <div className="min-h-screen text-white font-mono">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Header responsivo */}
        <header className="flex flex-col sm:flex-row justify-between sm:items-start mb-6 gap-4">
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
                onClick={handleOpenAddModal}
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
        </header>

        {/* Filtros responsivos */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label 
              htmlFor="search-input" 
              className="block text-sm font-bold text-white mb-1 uppercase"
            >
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

          <div>
            <label 
              htmlFor="role-filter" 
              className="block text-sm font-bold text-white mb-1 uppercase"
            >
              Rol
            </label>
            <select
              id="role-filter"
              value={filters.role}
              onChange={handleFilterChange('role')}
              className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <option value="">Todos</option>
              <option value="Admin">Admin</option>
              <option value="User">User</option>
            </select>
          </div>

          <div>
            <label 
              htmlFor="status-filter" 
              className="block text-sm font-bold text-white mb-1 uppercase"
            >
              Estado
            </label>
            <select
              id="status-filter"
              value={filters.status}
              onChange={handleFilterChange('status')}
              className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <option value="">Todos</option>
              <option value="Active">Activo</option>
              <option value="Inactive">Inactivo</option>
            </select>
          </div>
        </section>

        {/* Contenido principal */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <ClipLoader color="#22d3ee" loading={loading} size={50} />
          </div>
        ) : error ? (
          <div className="text-center mt-8">
            <p className="text-red-400" role="alert">
              {error}
            </p>
          </div>
        ) : (
          <>
            {/* Tabla responsiva */}
            <div className="overflow-x-auto bg-black/50 border-2 border-gray-600 rounded-lg">
              <table className="min-w-full">
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

                <tbody className="divide-y divide-gray-700">
                  {users.map((user) => {
                    const imageUrl = getImageUrl(user.profilePicture);
                    
                    return (
                      <tr key={user._id} className="hover:bg-gray-800">
                        {/* Foto de perfil */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {imageUrl ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover border-2 border-cyan-400"
                                src={imageUrl}
                                alt={`Foto de ${user.firstName} ${user.lastName}`}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-cyan-400">
                                {getInitials(user.firstName, user.lastName)}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Nombre */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {user.firstName} {user.lastName}
                        </td>

                        {/* Email */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {user.email}
                        </td>

                        {/* Teléfono */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {user.phoneNumber || 'N/A'}
                        </td>

                        {/* Dirección */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {user.address && user.address.street 
                            ? `${user.address.street} ${user.address.number}` 
                            : 'N/A'
                          }
                        </td>

                        {/* Rol */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                            user.role === 'Admin' 
                              ? 'bg-purple-500 text-white' 
                              : 'bg-blue-500 text-white'
                          }`}>
                            {user.role}
                          </span>
                        </td>

                        {/* Estado */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs leading-5 font-bold rounded-full ${
                            user.status === 'Active' 
                              ? 'bg-green-500 text-black' 
                              : 'bg-yellow-500 text-black'
                          }`}>
                            {user.status}
                          </span>
                        </td>

                        {/* Acciones (solo para Admin) */}
                        {userRole === 'Admin' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                            <button
                              onClick={() => handleEditClick(user)}
                              className="text-cyan-400 hover:text-white transition-colors mr-4"
                            >
                              EDITAR
                            </button>
                            <button
                              onClick={() => handleDelete(user._id)}
                              className="text-red-500 hover:text-white transition-colors"
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

              {/* Mensaje cuando no hay usuarios */}
              {users.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400">No se encontraron usuarios.</p>
                </div>
              )}
            </div>

            {/* Paginación */}
            <nav className="flex justify-between items-center mt-4">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                className="px-4 py-2 text-sm border-2 border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-800 transition-colors"
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
                className="px-4 py-2 text-sm border-2 border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-800 transition-colors"
              >
                SIGUIENTE
              </button>
            </nav>
          </>
        )}

        {/* Modales (solo para Admin) */}
        {userRole === 'Admin' && (
          <>
            <AddUserModal
              isOpen={isAddModalOpen}
              onClose={handleCloseAddModal}
              onUserAdded={fetchUsers}
            />
            <EditUserModal
              isOpen={isEditModalOpen}
              onClose={handleCloseEditModal}
              onUserUpdated={fetchUsers}
              userToEdit={currentUserToEdit}
            />
          </>
        )}
      </div>
    </div>
  );
}