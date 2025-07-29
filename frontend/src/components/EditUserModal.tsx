"use client";

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import { HiEye, HiEyeOff } from 'react-icons/hi';

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

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
  userToEdit: User | null;
}

interface ValidationErrors {
  [key: string]: string;
}

// ==================== CONSTANTS ====================
const libraries: ("places")[] = ['places'];

// ==================== MAIN COMPONENT ====================
export default function EditUserModal({ 
  isOpen, 
  onClose, 
  onUserUpdated, 
  userToEdit 
}: EditUserModalProps) {
  
  // ==================== STATE ====================
  const [initialData, setInitialData] = useState<any>({});
  const [formData, setFormData] = useState({
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
  const [password, setPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  // ==================== HOOKS ====================
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_Maps_API_KEY || '',
    libraries
  });
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // ==================== EFFECTS ====================
  useEffect(() => {
    if (userToEdit) {
      const userData = {
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
      };
      setFormData(userData);
      setInitialData(userData);
      setPassword('');
      setProfilePicture(null);
      setErrors({});
    }
  }, [userToEdit]);

  // ==================== EVENT HANDLERS ====================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePicture(e.target.files[0]);
    }
  };

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      const address = { ...formData.address };
      
      place.address_components?.forEach(component => {
        const types = component.types;
        if (types.includes('street_number')) {
          address.number = component.long_name;
        }
        if (types.includes('route')) {
          address.street = component.long_name;
        }
        if (types.includes('locality')) {
          address.city = component.long_name;
        }
        if (types.includes('postal_code')) {
          address.postalCode = component.long_name;
        }
      });
      
      setFormData(prev => ({
        ...prev,
        address
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;
    
    setErrors({});
    const token = localStorage.getItem('token');
    
    // 1. Calculate only the changed fields
    const changedData: any = {};
    for (const key in formData) {
      if (JSON.stringify((formData as any)[key]) !== JSON.stringify((initialData as any)[key])) {
        changedData[key] = (formData as any)[key];
      }
    }
    
    // 2. Create FormData and only append changed data
    const data = new FormData();
    Object.keys(changedData).forEach(key => {
      if (key === 'address') {
        data.append('address', JSON.stringify(changedData.address));
      } else {
        data.append(key, changedData[key]);
      }
    });

    if (password) {
      data.append('password', password);
    }
    if (profilePicture) {
      data.append('profilePicture', profilePicture);
    }
    
    // Prevent empty submission
    if (Object.keys(changedData).length === 0 && !password && !profilePicture) {
      onClose(); // Just close the modal if nothing changed
      return;
    }

    try {
      await axios.put(
        `http://localhost:5001/api/users/${userToEdit._id}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      onUserUpdated();
      onClose();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.status === 422) {
          setErrors(err.response.data.errors);
        } else {
          setErrors({
            general: err.response.data.message || 'No se pudo actualizar el usuario.'
          });
        }
      } else {
        setErrors({
          general: 'Ocurrió un error inesperado.'
        });
      }
    }
  };

  // ==================== RENDER ====================
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10 font-mono" onClose={onClose}>
        {/* Backdrop */}
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

        {/* Modal Container */}
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
                
                {/* Modal Title */}
                <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-cyan-400">
                  EDITAR USUARIO
                </Dialog.Title>

                {/* Form */}
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  
                  {/* Basic Information */}
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
                      className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md"
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
                      className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md"
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
                      className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md"
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
                      required
                      className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md"
                    />
                  </div>

                  {/* Password Section */}
                  <div>
                    <label htmlFor="edit-password" className="block text-sm font-bold text-white mb-1">
                      NUEVA CONTRASEÑA
                    </label>
                    <div className="relative mt-1">
                      <input
                        id="edit-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Dejar en blanco para no cambiar"
                        className="w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400"
                      >
                        {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Profile Picture Section */}
                  <h4 className="font-bold pt-2 text-cyan-400">FOTO DE PERFIL</h4>
                  
                  {userToEdit?.profilePicture && (
                    <div className="my-2 text-center">
                      <p className="text-sm font-bold text-white mb-2">FOTO ACTUAL</p>
                      <img
                        src={
                          userToEdit.profilePicture.startsWith('http')
                            ? userToEdit.profilePicture
                            : `http://localhost:5001/${userToEdit.profilePicture}`
                        }
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
                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-cyan-900 file:text-cyan-300 hover:file:bg-cyan-800"
                  />

                  {/* Address Section */}
                  <h4 className="font-bold pt-2 text-cyan-400">DIRECCIÓN</h4>
                  
                  {isLoaded ? (
                    <Autocomplete
                      onLoad={(ref) => (autocompleteRef.current = ref)}
                      onPlaceChanged={handlePlaceChanged}
                    >
                      <input
                        type="text"
                        placeholder="Buscar..."
                        className="w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md"
                      />
                    </Autocomplete>
                  ) : (
                    <div>Cargando...</div>
                  )}

                  <div>
                    <label htmlFor="edit-street" className="block text-sm font-bold text-white mb-1">
                      CALLE
                    </label>
                    <input
                      id="edit-street"
                      type="text"
                      name="street"
                      value={formData.address.street}
                      onChange={handleAddressChange}
                      className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-number" className="block text-sm font-bold text-white mb-1">
                      NÚMERO
                    </label>
                    <input
                      id="edit-number"
                      type="text"
                      name="number"
                      value={formData.address.number}
                      onChange={handleAddressChange}
                      className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-city" className="block text-sm font-bold text-white mb-1">
                      CIUDAD
                    </label>
                    <input
                      id="edit-city"
                      type="text"
                      name="city"
                      value={formData.address.city}
                      onChange={handleAddressChange}
                      className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-postalCode" className="block text-sm font-bold text-white mb-1">
                      CÓDIGO POSTAL
                    </label>
                    <input
                      id="edit-postalCode"
                      type="text"
                      name="postalCode"
                      value={formData.address.postalCode}
                      onChange={handleAddressChange}
                      className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md"
                    />
                  </div>

                  {/* Configuration Section */}
                  <h4 className="font-bold pt-2 text-cyan-400">CONFIGURACIÓN</h4>
                  
                  <div>
                    <label htmlFor="edit-role" className="block text-sm font-bold text-white mb-1">
                      ROL
                    </label>
                    <select
                      id="edit-role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md"
                    >
                      <option value="User">User</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="edit-status" className="block text-sm font-bold text-white mb-1">
                      ESTADO
                    </label>
                    <select
                      id="edit-status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Error Messages */}
                  {errors.general && (
                    <p className="text-red-400 text-sm text-center">{errors.general}</p>
                  )}
                  {Object.keys(errors).filter(key => key !== 'general').map(key => (
                    <p key={key} className="text-red-400 text-sm text-center">
                      {errors[key]}
                    </p>
                  ))}

                  {/* Action Buttons */}
                  <div className="mt-6 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-bold text-white bg-gray-600 rounded-md hover:bg-gray-700"
                    >
                      CANCELAR
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-bold text-black bg-cyan-400 rounded-md hover:bg-white"
                    >
                      GUARDAR
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