"use client";

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useRef } from 'react';
import axios from 'axios';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import { HiEye, HiEyeOff } from 'react-icons/hi';

interface AddUserModalProps { isOpen: boolean; onClose: () => void; onUserAdded: () => void; }
const libraries: ("places")[] = ['places'];
interface ValidationErrors { [key: string]: string; }

export default function AddUserModal({ isOpen, onClose, onUserAdded }: AddUserModalProps) {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '', phoneNumber: '', role: 'User', status: 'Active', address: { street: '', number: '', city: '', postalCode: '' } });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey: process.env.NEXT_PUBLIC_Maps_API_KEY || '', libraries });
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, address: { ...prev.address, [name]: value } })); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { setProfilePicture(e.target.files[0]); } };
  const handlePlaceChanged = () => { if (autocompleteRef.current) { const place = autocompleteRef.current.getPlace(); const address = { street: '', number: '', city: '', postalCode: '' }; place.address_components?.forEach(component => { const types = component.types; if (types.includes('street_number')) address.number = component.long_name; if (types.includes('route')) address.street = component.long_name; if (types.includes('locality')) address.city = component.long_name; if (types.includes('postal_code')) address.postalCode = component.long_name; }); setFormData(prev => ({ ...prev, address })); } };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const token = localStorage.getItem('token');
    const data = new FormData();
    data.append('firstName', formData.firstName);
    data.append('lastName', formData.lastName);
    data.append('email', formData.email);
    data.append('password', formData.password);
    data.append('phoneNumber', formData.phoneNumber);
    data.append('role', formData.role);
    data.append('status', formData.status);
    data.append('address', JSON.stringify(formData.address));
    if (profilePicture) { data.append('profilePicture', profilePicture); }
    try {
      await axios.post('http://localhost:5001/api/users', data, { headers: { Authorization: `Bearer ${token}` } });
      onUserAdded();
      onClose();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.status === 422) { setErrors(err.response.data.errors); } 
        else { setErrors({ general: err.response.data.message || 'No se pudo crear el usuario.' }); }
      } else { setErrors({ general: 'Ocurrió un error inesperado.' }); }
      console.error(err);
    }
  };

  if (loadError) return <div>Error al cargar los mapas.</div>;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10 font-mono" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/50" /></Transition.Child>
        <div className="fixed inset-0 overflow-y-auto"><div className="flex min-h-full items-center justify-center p-4 text-center">
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
          <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-gray-900 border-4 border-white p-6 text-left align-middle shadow-xl transition-all">
            <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-cyan-400">AÑADIR USUARIO</Dialog.Title>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div><label htmlFor="add-firstName" className="block text-sm font-bold text-white mb-1">NOMBRE</label><input id="add-firstName" type="text" name="firstName" onChange={handleChange} className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md"/>{errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}</div>
              <div><label htmlFor="add-lastName" className="block text-sm font-bold text-white mb-1">APELLIDO</label><input id="add-lastName" type="text" name="lastName" onChange={handleChange} className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md"/>{errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}</div>
              <div><label htmlFor="add-email" className="block text-sm font-bold text-white mb-1">EMAIL</label><input id="add-email" type="email" name="email" onChange={handleChange} className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md"/>{errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}</div>
              <div><label htmlFor="add-password" className="block text-sm font-bold text-white mb-1">CONTRASEÑA</label><div className="relative mt-1"><input id="add-password" type={showPassword ? 'text' : 'password'} name="password" onChange={handleChange} className="w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md"/><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400">{showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}</button></div>{errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}</div>
              <div><label htmlFor="add-phoneNumber" className="block text-sm font-bold text-white mb-1">TELÉFONO</label><input id="add-phoneNumber" type="tel" name="phoneNumber" onChange={handleChange} className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md"/>{errors.phoneNumber && <p className="text-red-400 text-xs mt-1">{errors.phoneNumber}</p>}</div>
              <h4 className="font-bold pt-2 text-cyan-400">FOTO DE PERFIL</h4><input type="file" name="profilePicture" onChange={handleFileChange} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-cyan-900 file:text-cyan-300 hover:file:bg-cyan-800"/>
              <h4 className="font-bold pt-2 text-cyan-400">DIRECCIÓN</h4>{isLoaded ? <Autocomplete onLoad={(ref) => (autocompleteRef.current = ref)} onPlaceChanged={handlePlaceChanged}><input type="text" placeholder="Buscar..." className="w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md"/></Autocomplete> : <div>Cargando...</div>}<div><label htmlFor="add-street" className="block text-sm font-bold text-white mb-1">CALLE</label><input id="add-street" type="text" name="street" value={formData.address.street} onChange={handleAddressChange} required className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md"/></div><div><label htmlFor="add-number" className="block text-sm font-bold text-white mb-1">NÚMERO</label><input id="add-number" type="text" name="number" value={formData.address.number} onChange={handleAddressChange} required className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md"/></div><div><label htmlFor="add-city" className="block text-sm font-bold text-white mb-1">CIUDAD</label><input id="add-city" type="text" name="city" value={formData.address.city} onChange={handleAddressChange} required className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md"/></div><div><label htmlFor="add-postalCode" className="block text-sm font-bold text-white mb-1">CÓDIGO POSTAL</label><input id="add-postalCode" type="text" name="postalCode" value={formData.address.postalCode} onChange={handleAddressChange} required className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md"/></div>
              <h4 className="font-bold pt-2 text-cyan-400">CONFIGURACIÓN</h4><div><label htmlFor="add-role" className="block text-sm font-bold text-white mb-1">ROL</label><select id="add-role" name="role" onChange={handleChange} value={formData.role} className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md"><option value="User">User</option><option value="Admin">Admin</option></select></div><div><label htmlFor="add-status" className="block text-sm font-bold text-white mb-1">ESTADO</label><select id="add-status" name="status" onChange={handleChange} value={formData.status} className="mt-1 w-full p-2 bg-gray-800 border-2 border-gray-600 rounded-md"><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
              {errors.general && <p className="text-red-400 text-sm text-center">{errors.general}</p>}
              <div className="mt-6 flex justify-end space-x-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-white bg-gray-600 rounded-md hover:bg-gray-700">CANCELAR</button><button type="submit" className="px-4 py-2 text-sm font-bold text-black bg-cyan-400 rounded-md hover:bg-white">CREAR</button></div>
            </form>
          </Dialog.Panel>
        </Transition.Child>
        </div></div>
      </Dialog>
    </Transition>
  );
}