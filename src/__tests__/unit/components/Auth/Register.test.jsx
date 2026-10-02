import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Register from '../../../../presentation/components/Auth/Register';

const { mockLogin, mockPost } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockPost: vi.fn(),
}));

vi.mock('../../../../presentation/context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

vi.mock('../../../../presentation/api/api', () => ({
  default: {
    post: mockPost,
  },
}));

describe('Register Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders registration form', () => {
    render(<Register />);

    expect(
      screen.getByRole('heading', { name: 'Crear Cuenta' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo Gmail')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Registrarse' })
    ).toBeInTheDocument();
  });

  it('updates form fields', async () => {
    const user = userEvent.setup();

    render(<Register />);

    await user.type(screen.getByLabelText('Nombre'), 'Juan Pérez');
    await user.type(
      screen.getByLabelText('Correo Gmail'),
      'juan@gmail.com'
    );
    await user.type(
      screen.getByLabelText('Contraseña'),
      'Password123'
    );

    expect(screen.getByLabelText('Nombre')).toHaveValue('Juan Pérez');
    expect(screen.getByLabelText('Correo Gmail')).toHaveValue(
      'juan@gmail.com'
    );
    expect(screen.getByLabelText('Contraseña')).toHaveValue(
      'Password123'
    );
  });

  it('submits registration and calls login with returned credentials', async () => {
    const user = userEvent.setup();

    mockPost.mockResolvedValue({
      data: {
        success: true,
        data: {
          user: {
            id: 1,
            nombre: 'Juan Pérez',
            rol: 'CLIENTE',
          },
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      },
    });

    render(<Register />);

    await user.type(screen.getByLabelText('Nombre'), 'Juan Pérez');
    await user.type(
      screen.getByLabelText('Correo Gmail'),
      'juan@gmail.com'
    );
    await user.type(
      screen.getByLabelText('Contraseña'),
      'Password123'
    );

    await user.click(
      screen.getByRole('button', { name: 'Registrarse' })
    );

    expect(mockPost).toHaveBeenCalledWith('/auth/register', {
      nombre: 'Juan Pérez',
      email: 'juan@gmail.com',
      password: 'Password123',
    });

    expect(mockLogin).toHaveBeenCalledWith({
      user: {
        id: 1,
        nombre: 'Juan Pérez',
        rol: 'CLIENTE',
      },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('shows backend error message when registration fails', async () => {
    const user = userEvent.setup();

    mockPost.mockRejectedValue({
      response: {
        data: {
          message: 'El correo ya está registrado',
        },
      },
    });

    render(<Register />);

    await user.type(screen.getByLabelText('Nombre'), 'Juan Pérez');
    await user.type(
      screen.getByLabelText('Correo Gmail'),
      'juan@gmail.com'
    );
    await user.type(
      screen.getByLabelText('Contraseña'),
      'Password123'
    );

    await user.click(
      screen.getByRole('button', { name: 'Registrarse' })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El correo ya está registrado'
    );
  });

  it('shows fallback error when registration fails without backend message', async () => {
    const user = userEvent.setup();

    mockPost.mockRejectedValue(new Error('Network error'));

    render(<Register />);

    await user.type(screen.getByLabelText('Nombre'), 'Juan Pérez');
    await user.type(
      screen.getByLabelText('Correo Gmail'),
      'juan@gmail.com'
    );
    await user.type(
      screen.getByLabelText('Contraseña'),
      'Password123'
    );

    await user.click(
      screen.getByRole('button', { name: 'Registrarse' })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Error al crear cuenta'
    );
  });

  it('disables submit button while registration is loading', async () => {
    const user = userEvent.setup();

    mockPost.mockImplementation(() => new Promise(() => {}));

    render(<Register />);

    await user.type(screen.getByLabelText('Nombre'), 'Juan Pérez');
    await user.type(
      screen.getByLabelText('Correo Gmail'),
      'juan@gmail.com'
    );
    await user.type(
      screen.getByLabelText('Contraseña'),
      'Password123'
    );

    await user.click(
      screen.getByRole('button', { name: 'Registrarse' })
    );

    expect(
      await screen.findByRole('button', { name: 'Creando...' })
    ).toBeDisabled();
  });
});
