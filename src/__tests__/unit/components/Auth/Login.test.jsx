// src/__tests__/unit/components/Auth/Login.test.jsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../../../presentation/components/Auth/Login';
import api from '../../../../presentation/api/api';
import { AuthProvider } from '../../../../presentation/context/AuthContext';

// Mock API
vi.mock('../../../../presentation/api/api', () => ({
  default: {
    defaults: {
      headers: {
        common: {},
      },
    },
    post: vi.fn(),
    interceptors: {
      response: {
        use: vi.fn(),
        eject: vi.fn(),
      },
    },
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderLogin = (props = {}) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Login {...props} />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render login form with email and password inputs', () => {
    renderLogin();

    expect(screen.getByRole('heading', { name: /Sistema de Gestión/i })).toBeInTheDocument();
    expect(screen.getByText(/Ingresa tus credenciales/i)).toBeInTheDocument();
  });

  it('should display session expired banner when sessionExpired is true', () => {
    const mockOnDismiss = vi.fn();
    renderLogin({ sessionExpired: true, onDismissExpired: mockOnDismiss });

    expect(screen.getByText(/Tu sesión expiró/i)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should dismiss session expired banner when close button is clicked', async () => {
    const mockOnDismiss = vi.fn();
    const user = userEvent.setup();
    renderLogin({ sessionExpired: true, onDismissExpired: mockOnDismiss });

    const dismissButton = screen.getByLabelText(/Cerrar aviso/i);
    await user.click(dismissButton);

    expect(mockOnDismiss).toHaveBeenCalled();
  });

  it('should have form elements present', () => {
    renderLogin();

    const form = screen.getByRole('heading', { name: /Sistema de Gestión/i }).closest('main');
    expect(form).toBeInTheDocument();
  });

  it('should be accessible with proper roles', () => {
    renderLogin();

    const main = screen.getByRole('heading', { name: /Sistema de Gestión/i }).closest('main');
    expect(main).toHaveAttribute('role', 'main');
  });

  it('should handle user input in form fields', async () => {
    const user = userEvent.setup();
    renderLogin();

    const emailInput = screen.getByLabelText('Correo electrónico');
    const passwordInput = screen.getByLabelText('Contraseña');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('should show and clear login error while handling loading state', async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValueOnce({
      response: {
        data: {
          message: 'Credenciales inválidas',
        },
      },
    });

    renderLogin();

    const emailInput = screen.getByLabelText('Correo electrónico');
    const passwordInput = screen.getByLabelText('Contraseña');
    const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrong-password');
    await user.click(submitButton);

    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas');
    expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    expect(emailInput).toHaveAttribute('aria-describedby');

    await user.clear(emailInput);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    expect(emailInput).toHaveAttribute('aria-invalid', 'false');
  });

  it('should complete login successfully when API returns success', async () => {
    const user = userEvent.setup();

    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          user: {
            id: 1,
            nombre: 'Usuario de prueba',
            email: 'test@example.com',
          },
          accessToken: 'access-token-test',
          refreshToken: 'refresh-token-test',
          expiresIn: '15m',
        },
      },
    });

    renderLogin();

    await user.type(
      screen.getByLabelText('Correo electrónico'),
      'test@example.com'
    );
    await user.type(
      screen.getByLabelText('Contraseña'),
      'password123'
    );
    await user.click(
      screen.getByRole('button', { name: 'Iniciar Sesión' })
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    expect(localStorage.getItem('user')).toBe(
      JSON.stringify({
        id: 1,
        nombre: 'Usuario de prueba',
        email: 'test@example.com',
      })
    );

    expect(api.defaults.headers.common.Authorization).toBe(
      'Bearer access-token-test'
    );
  });

  it('should use default error message when login error has no message', async () => {
    const user = userEvent.setup();

    api.post.mockRejectedValueOnce({
      response: {
        data: {},
      },
    });

    renderLogin();

    await user.type(
      screen.getByLabelText('Correo electrónico'),
      'test@example.com'
    );
    await user.type(
      screen.getByLabelText('Contraseña'),
      'wrong-password'
    );
    await user.click(
      screen.getByRole('button', { name: 'Iniciar Sesión' })
    );

    expect(
      await screen.findByRole('alert')
    ).toHaveTextContent('Credenciales incorrectas');
  });

  it('should show loading state while login request is pending', async () => {
    const user = userEvent.setup();
    let resolveRequest;
    api.post.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );

    renderLogin();

    const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' });

    await user.click(submitButton);

    expect(screen.getByRole('button', { name: 'Ingresando...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Ingresando...' })).toHaveAttribute(
      'aria-busy',
      'true'
    );

    resolveRequest({
      data: {
        success: false,
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Iniciar Sesión' })).not.toBeDisabled();
    });
  });
});
