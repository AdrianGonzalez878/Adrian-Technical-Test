"use client";

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { HiEye, HiEyeOff } from 'react-icons/hi';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', {
        email,
        password,
      });
      localStorage.setItem('token', response.data.token);
      router.push('/dashboard');
    } catch (err) {
      setError('Credenciales inválidas.');
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen font-mono p-4">
      {/* Title with hover animation */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-cyan-400 tracking-wider transition-all duration-300 hover:tracking-widest hover:text-white cursor-pointer">
          Project Karimnot
        </h1>
        <p className="text-gray-400 mt-2">Panel de Administración</p>
      </div>

      {/* Login Form Container */}
      <div className="w-full max-w-sm p-8 space-y-6 bg-black/50 border-4 border-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center text-white">
          INICIAR SESIÓN
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-white mb-1">CORREO</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-bold text-white mb-1">CONTRASEÑA</label>
            <div className="relative mt-1">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-cyan-400">
                {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
              </button>
            </div>
          </div>
          {error && (<p className="text-sm text-center text-red-400">{error}</p>)}
          <div>
            <button
              type="submit"
              className="w-full px-4 py-3 font-bold text-black bg-cyan-400 rounded-lg shadow-md hover:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              ENTRAR
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}