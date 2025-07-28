"use client";

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import { HiEye, HiEyeOff } from 'react-icons/hi';

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

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
  userToEdit: User | null;
}

interface Address {
  street: string;
  number: string;
  city: string;
  postalCode: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
  status: string;
  address: Address;
}

const libraries: ("places")[] = ['places'];

export default function EditUserModal({ isOpen, onClose, onUserUpdated, userToEdit }: EditUserModalProps) {
  // Estados del componente
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: '',
    status: '',
    address: {
      street: '',
      number: '',
      city: '',
      postalCode: ''
    }
  });

  const [password, setPassword] = useState<string>('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Google Maps setup
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_Maps_API_KEY || '',
    libraries
  });
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Effect para poblar el formulario cuando cambie userToEdit
  useEffect(() => {
    if (userToEdit) {
      setFormData({
        firstName: userToEdit.firstName,
        lastName: userToEdit.lastName,
        email: userToEdit.email,
        phoneNumber: userToEdit.phoneNumber || '',
        role: userToEdit.role,
        status: userToEdit.status,
        address: userToEdit.address || {
          street: '',
          number: '',
          city: '',
          postalCode: ''
        }
      });
      
      // Reset otros estados
      setPassword('');
      setProfilePicture(null);
      setError('');
      setShowPassword(false);
      setIsLoading(false);
    }
  }, [userToEdit]);

  // Manejadores de eventos
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error cuando el usuario haga cambios
    if (error) {
      setError('');
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value
      }
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) {
      setError('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePicture(e.target.files[0]);
    }
  };

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      const newAddress = { ...formData.address };

      place.address_components?.forEach(component => {
        const types = component.types;
        if (types.includes('street_number')) {
          newAddress.number = component.long_name;
        }
        if (types.includes('route')) {
          newAddress.street = component.long_name;
        }
        if (types.includes('locality')) {
          newAddress.city = component.long_name;
        }
        if (types.includes('postal_code')) {
          newAddress.postalCode = component.long_name;
        }
      });

      setFormData(prev => ({
        ...prev,
        address: newAddress
      }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userToEdit) {
      setError('No se pudo identificar el usuario a editar.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const data = new FormData();
      data.append('firstName', formData.firstName);
      data.append('lastName', formData.lastName);
      data.append('email', formData.email);
      data.append('phoneNumber', formData.phoneNumber);
      data.append('role', formData.role);
      data.append('status', formData.status);
      data.append('address', JSON.stringify(formData.address));

      // Solo incluir contraseña si se proporcionó una nueva
      if (password.trim()) {
        data.append('password', password);
      }

      // Solo incluir foto si se seleccionó una nueva
      if (profilePicture) {
        data.append('profilePicture', profilePicture);
      }

      await axios.put(`http://localhost:5001/api/users/${userToEdit._id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Éxito: actualizar lista y cerrar modal
      onUserUpdated();
      onClose();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.message || 'No se pudo actualizar el usuario.';
        setError(errorMessage);
      } else {
        setError('Error inesperado al actualizar el usuario.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  // Función para generar URL de imagen
  const getImageUrl = (profilePicture: string) => {
    return profilePicture.startsWith('http') 
      ? profilePicture 
      : `http://localhost:5001/${profilePicture}`;
  };

  // Manejo de errores de carga de Google Maps
  if (loadError) {
    return <div>Error al cargar los mapas. Revisa tu clave de API.</div>;
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10 font-mono" onClose={handleModalClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-gray-900 border-4 border-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-cyan-400">
                  EDITAR USUARIO
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  {/* Información Personal */}
                  <div>
                    <label htmlFor="edit-firstName" className="block text-sm font-bold text-white mb-1">
                      NOMBRE
                    </label>
                    <input
                      id="edit-firstName"
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      disabled={isLoading}
                      required
                      className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-lastName" className="block text-sm font-bold text-white mb-1">
                      APELLIDO
                    </label>
                    <input
                      id="edit-lastName"
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      disabled={isLoading}
                      required
                      className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-email" className="block text-sm font-bold text-white mb-1">
                      EMAIL
                    </label>
                    <input
                      id="edit-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isLoading}
                      required
                      className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-phoneNumber" className="block text-sm font-bold text-white mb-1">
                      TELÉFONO
                    </label>
                    <input
                      id="edit-phoneNumber"
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Contraseña */}
                  <div>
                    <label htmlFor="edit-password" className="block text-sm font-bold text-white mb-1">
                      NUEVA CONTRASEÑA
                    </label>
                    <div className="relative mt-1">
                      <input
                        id="edit-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={handlePasswordChange}
                        disabled={isLoading}
                        placeholder="Dejar en blanco para no cambiar"
                        className="w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        disabled={isLoading}
                        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Foto de Perfil */}
                  <div>
                    <h4 className="font-bold pt-2 text-cyan-400">FOTO DE PERFIL</h4>
                    
                    {/* Mostrar foto actual si existe */}
                    {userToEdit?.profilePicture && (
                      <div className="my-2 text-center">
                        <p className="text-sm font-bold text-white mb-2">FOTO ACTUAL</p>
                        <img
                          src={getImageUrl(userToEdit.profilePicture)}
                          alt="Foto de perfil actual"
                          className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-cyan-400"
                        />
                      </div>
                    )}

                    <label htmlFor="edit-profilePicture" className="block text-sm font-bold text-white mb-1">
                      {userToEdit?.profilePicture ? 'CAMBIAR FOTO' : 'AÑADIR FOTO'}
                    </label>
                    <input
                      id="edit-profilePicture"
                      type="file"
                      name="profilePicture"
                      onChange={handleFileChange}
                      disabled={isLoading}
                      accept="image/*"
                      className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-cyan-900 file:text-cyan-300 hover:file:bg-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Dirección */}
                  <div>
                    <h4 className="font-bold pt-2 text-cyan-400">DIRECCIÓN</h4>
                    
                    {isLoaded ? (
                      <Autocomplete
                        onLoad={(ref) => (autocompleteRef.current = ref)}
                        onPlaceChanged={handlePlaceChanged}
                      >
                        <input
                          type="text"
                          placeholder="Buscar dirección..."
                          disabled={isLoading}
                          className="w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </Autocomplete>
                    ) : (
                      <div className="text-gray-400">Cargando mapas...</div>
                    )}

                    <div className="mt-2">
                      <label htmlFor="edit-street" className="block text-sm font-bold text-white mb-1">
                        CALLE
                      </label>
                      <input
                        id="edit-street"
                        type="text"
                        name="street"
                        value={formData.address.street}
                        onChange={handleAddressChange}
                        disabled={isLoading}
                        className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div className="mt-2">
                      <label htmlFor="edit-number" className="block text-sm font-bold text-white mb-1">
                        NÚMERO
                      </label>
                      <input
                        id="edit-number"
                        type="text"
                        name="number"
                        value={formData.address.number}
                        onChange={handleAddressChange}
                        disabled={isLoading}
                        className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div className="mt-2">
                      <label htmlFor="edit-city" className="block text-sm font-bold text-white mb-1">
                        CIUDAD
                      </label>
                      <input
                        id="edit-city"
                        type="text"
                        name="city"
                        value={formData.address.city}
                        onChange={handleAddressChange}
                        disabled={isLoading}
                        className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div className="mt-2">
                      <label htmlFor="edit-postalCode" className="block text-sm font-bold text-white mb-1">
                        CÓDIGO POSTAL
                      </label>
                      <input
                        id="edit-postalCode"
                        type="text"
                        name="postalCode"
                        value={formData.address.postalCode}
                        onChange={handleAddressChange}
                        disabled={isLoading}
                        className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Configuración */}
                  <div>
                    <h4 className="font-bold pt-2 text-cyan-400">CONFIGURACIÓN</h4>
                    
                    <div className="mt-2">
                      <label htmlFor="edit-role" className="block text-sm font-bold text-white mb-1">
                        ROL
                      </label>
                      <select
                        id="edit-role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        disabled={isLoading}
                        className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="User">User</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>

                    <div className="mt-2">
                      <label htmlFor="edit-status" className="block text-sm font-bold text-white mb-1">
                        ESTADO
                      </label>
                      <select
                        id="edit-status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        disabled={isLoading}
                        className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  {/* Mensaje de error */}
                  {error && (
                    <div className="text-center">
                      <p className="text-red-400 text-sm" role="alert">
                        {error}
                      </p>
                    </div>
                  )}

                  {/* Botones */}
                  <div className="mt-6 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={handleModalClose}
                      disabled={isLoading}
                      className="px-4 py-2 text-sm font-bold text-white bg-gray-600 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      CANCELAR
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 text-sm font-bold text-black bg-cyan-400 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? 'GUARDANDO...' : 'GUARDAR'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}