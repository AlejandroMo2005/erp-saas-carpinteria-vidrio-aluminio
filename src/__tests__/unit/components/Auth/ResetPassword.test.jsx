import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResetPassword from '../../../../presentation/components/Auth/ResetPassword';

const { mockPost, mockNavigate } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('../../../../presentation/api/api', () => ({
  default: {
    post: mockPost,
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');

  return {
    ...actual,
    useParams: () => ({
      token: 'reset-token-123',
    }),
    useNavigate: () => mockNavigate,
  };
});

describe('ResetPassword Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders reset password form', () => {
    render(<ResetPassword />);

    expect(
      screen.getByRole('heading', { name: 'Nueva Contraseña' })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText('Nueva contraseña')
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: 'Actualizar contraseña',
      })
    ).toBeInTheDocument();
  });

  it('updates password field', async () => {
    const user = userEvent.setup();

    render(<ResetPassword />);

    const input = screen.getByLabelText('Nueva contraseña');

    await user.type(input, 'NuevaPassword123');

    expect(input).toHaveValue('NuevaPassword123');
  });

  it('submits password reset successfully and redirects after timeout', async () => {
    const user = userEvent.setup();

    mockPost.mockResolvedValue({
      data: {
        message: 'Contraseña cambiada correctamente',
      },
    });

    render(<ResetPassword />);

    await user.type(
      screen.getByLabelText('Nueva contraseña'),
      'NuevaPassword123'
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Actualizar contraseña',
      })
    );

    expect(mockPost).toHaveBeenCalledWith('/auth/reset-password', {
      token: 'reset-token-123',
      newPassword: 'NuevaPassword123',
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Contraseña cambiada correctamente'
    );

    expect(
      screen.getByRole('button', {
        name: 'Actualizar contraseña',
      })
    ).toBeDisabled();

    await new Promise(resolve => setTimeout(resolve, 2100));

    expect(mockNavigate).toHaveBeenCalledWith('/');
  }, 5000);

  it('uses fallback success message when backend does not provide one', async () => {
    const user = userEvent.setup();

    mockPost.mockResolvedValue({
      data: {},
    });

    render(<ResetPassword />);

    await user.type(
      screen.getByLabelText('Nueva contraseña'),
      'NuevaPassword123'
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Actualizar contraseña',
      })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Contraseña actualizada'
    );
  });

  it('shows backend error message when reset fails', async () => {
    const user = userEvent.setup();

    mockPost.mockRejectedValue({
      response: {
        data: {
          message: 'El token ha expirado',
        },
      },
    });

    render(<ResetPassword />);

    await user.type(
      screen.getByLabelText('Nueva contraseña'),
      'NuevaPassword123'
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Actualizar contraseña',
      })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El token ha expirado'
    );

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows fallback error when reset fails without backend message', async () => {
    const user = userEvent.setup();

    mockPost.mockRejectedValue(new Error('Network error'));

    render(<ResetPassword />);

    await user.type(
      screen.getByLabelText('Nueva contraseña'),
      'NuevaPassword123'
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Actualizar contraseña',
      })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Error al actualizar contraseña'
    );
  });
});
