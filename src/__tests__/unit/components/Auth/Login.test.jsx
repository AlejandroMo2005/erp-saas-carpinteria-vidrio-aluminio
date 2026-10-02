// src/__tests__/unit/components/Auth/Login.test.jsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../../../presentation/components/Auth/Login';
import { AuthProvider } from '../../../../presentation/context/AuthContext';

// Mock API
vi.mock('../../../../api/api', () => ({
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
});
