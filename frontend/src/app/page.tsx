"use client";

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { HiEye, HiEyeOff } from 'react-icons/hi';

// Interfaces y tipos
interface LoginFormData {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
}

export default function LoginPage() {
  // Estados del componente
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Hooks
  const router = useRouter();

  // Manejadores de eventos
  const handleInputChange = (field: keyof LoginFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    
    // Limpiar error cuando el usuario comience a escribir
    if (error) {
      setError('');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post<LoginResponse>(
        'http://localhost:5001/api/auth/login',
        {
          email: formData.email,
          password: formData.password,
        }
      );

      // Guardar token en localStorage
      localStorage.setItem('token', response.data.token);
      
      // Redirigir al dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('Credenciales inválidas.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen font-mono">
      <div className="w-full max-w-sm p-8 space-y-6 bg-black/50 border-4 border-white rounded-lg shadow-lg">
        
        {/* Header del proyecto */}
        <header className="text-center">
          <h1 className="text-4xl font-bold text-cyan-400 tracking-wider">
            Project Karimnot
          </h1>
          <p className="text-gray-400 mt-2">
            Panel de Administración
          </p>
        </header>

        {/* Formulario de login */}
        <form onSubmit={handleSubmit} className="space-y-6 pt-6">
          
          {/* Campo Email */}
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-bold text-white mb-1"
            >
              CORREO
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange('email')}
              disabled={isLoading}
              className="mt-1 w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="usuario@ejemplo.com"
            />
          </div>

          {/* Campo Contraseña */}
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-bold text-white mb-1"
            >
              CONTRASEÑA
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleInputChange('password')}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="••••••••"
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

          {/* Mensaje de error */}
          {error && (
            <div className="text-center">
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            </div>
          )}

          {/* Botón de envío */}
          <div>
            <button
              type="submit"
              disabled={isLoading || !formData.email || !formData.password}
              className="w-full px-4 py-3 font-bold text-black bg-cyan-400 rounded-lg shadow-md hover:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-cyan-400"
            >
              {isLoading ? 'INGRESANDO...' : 'ENTRAR'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}