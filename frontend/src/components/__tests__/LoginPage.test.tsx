import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from '../../app/page';

// Mock del router de Next.js
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: () => jest.fn(),
    };
  },
}));

describe('LoginPage', () => {
  it('renders the login form correctly', () => {
    render(<LoginPage />);

    // LÍNEA CORREGIDA: Ahora busca el título correcto del proyecto
    expect(screen.getByRole('heading', { name: /Project Karimnot/i })).toBeInTheDocument();

    // El resto de las pruebas para los campos y el botón ya son correctas
    expect(screen.getByLabelText(/CORREO/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/CONTRASEÑA/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ENTRAR/i })).toBeInTheDocument();
  });
});