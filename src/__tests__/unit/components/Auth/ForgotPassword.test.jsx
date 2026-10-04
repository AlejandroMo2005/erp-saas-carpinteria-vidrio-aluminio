import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPassword from '../../../../presentation/components/Auth/ForgotPassword';

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
    useNavigate: () => mockNavigate,
  };
});

describe('ForgotPassword Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders step 1 with email form', () => {
    render(<ForgotPassword />);

    expect(
      screen.getByRole('heading', { name: 'Recuperar Contraseña' })
    ).toBeInTheDocument();

    expect(
      screen.getByText('Ingresa tu correo registrado')
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText('Correo electrónico')
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Enviar Código' })
    ).toBeInTheDocument();
  });

  it('updates email field', async () => {
    const user = userEvent.setup();

    render(<ForgotPassword />);

    const emailInput = screen.getByLabelText('Correo electrónico');

    await user.type(emailInput, 'usuario@gmail.com');

    expect(emailInput).toHaveValue('usuario@gmail.com');
  });

  it('submits email successfully and moves to step 2', async () => {
    const user = userEvent.setup();

    mockPost.mockResolvedValue({
      data: {
        success: true,
        token: 'recovery-token-123',
      },
    });

    render(<ForgotPassword />);

    await user.type(
      screen.getByLabelText('Correo electrónico'),
      'usuario@gmail.com'
    );

    await user.click(
      screen.getByRole('button', { name: 'Enviar Código' })
    );

    expect(mockPost).toHaveBeenCalledWith(
      '/auth/forgot-password',
      {
        email: 'usuario@gmail.com',
      }
    );

    expect(
      await screen.findByText('✅ Código enviado a tu correo')
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Enviar Código' })
    ).toBeInTheDocument();

    await new Promise(resolve => setTimeout(resolve, 2100));

    expect(
      screen.getByText('Ingresa el código enviado a tu correo')
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText('Código de 6 dígitos')
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Verificar Código' })
    ).toBeInTheDocument();
  }, 5000);

  it('shows backend error when sending email fails', async () => {
    const user = userEvent.setup();

    mockPost.mockRejectedValue({
      response: {
        data: {
          message: 'El correo no está registrado',
        },
      },
    });

    render(<ForgotPassword />);

    await user.type(
      screen.getByLabelText('Correo electrónico'),
      'usuario@gmail.com'
    );

    await user.click(
      screen.getByRole('button', { name: 'Enviar Código' })
    );

    expect(
      await screen.findByText('El correo no está registrado')
    ).toBeInTheDocument();
  });

  it('shows fallback error when sending email fails without backend message', async () => {
    const user = userEvent.setup();

    mockPost.mockRejectedValue(new Error('Network error'));

    render(<ForgotPassword />);

    await user.type(
      screen.getByLabelText('Correo electrónico'),
      'usuario@gmail.com'
    );

    await user.click(
      screen.getByRole('button', { name: 'Enviar Código' })
    );

    expect(
      await screen.findByText('Error al enviar solicitud')
    ).toBeInTheDocument();
  });

  it('disables submit button while sending email', async () => {
    const user = userEvent.setup();

    mockPost.mockImplementation(() => new Promise(() => { }));

    render(<ForgotPassword />);

    await user.type(
      screen.getByLabelText('Correo electrónico'),
      'usuario@gmail.com'
    );

    await user.click(
      screen.getByRole('button', { name: 'Enviar Código' })
    );

    expect(
      await screen.findByRole('button', { name: 'Enviando...' })
    ).toBeDisabled();
  });

  it('sanitizes code input to digits and maximum 6 characters', async () => {
    const user = userEvent.setup();

    mockPost.mockResolvedValue({
      data: {
        success: true,
        token: 'recovery-token-123',
      },
    });

    render(<ForgotPassword />);

    await user.type(
      screen.getByLabelText('Correo electrónico'),
      'usuario@gmail.com'
    );

    await user.click(
      screen.getByRole('button', { name: 'Enviar Código' })
    );

    await screen.findByText('✅ Código enviado a tu correo');

    await new Promise(resolve => setTimeout(resolve, 2100));

    const codeInput = screen.getByLabelText('Código de 6 dígitos');

    await user.type(codeInput, '12a34-56789');

    expect(codeInput).toHaveValue('123456');
  }, 5000);

  it('submits verification code successfully and moves to step 3', async () => {
    const user = userEvent.setup();

    mockPost
      .mockResolvedValueOnce({
        data: {
          success: true,
          token: 'recovery-token-123',
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
        },
      });

    render(<ForgotPassword />);

    await user.type(
      screen.getByLabelText('Correo electrónico'),
      'usuario@gmail.com'
    );

    await user.click(
      screen.getByRole('button', { name: 'Enviar Código' })
    );

    await screen.findByText('✅ Código enviado a tu correo');

    await new Promise(resolve => setTimeout(resolve, 2100));

    await user.type(
      screen.getByLabelText('Código de 6 dígitos'),
      '123456'
    );

    await user.click(
      screen.getByRole('button', { name: 'Verificar Código' })
    );

    expect(mockPost).toHaveBeenLastCalledWith(
      '/auth/verify-code',
      {
        token: 'recovery-token-123',
        code: '123456',
      }
    );

    expect(
      await screen.findByText('✅ Código verificado')
    ).toBeInTheDocument();

    await new Promise(resolve => setTimeout(resolve, 1600));

    expect(
      screen.getByText('Crea tu nueva contraseña')
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText('Nueva contraseña')
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Cambiar Contraseña' })
    ).toBeInTheDocument();
  }, 8000);

  it('shows backend error when code verification fails', async () => {
    const user = userEvent.setup();

    mockPost
      .mockResolvedValueOnce({
        data: {
          success: true,
          token: 'recovery-token-123',
        },
      })
      .mockRejectedValueOnce({
        response: {
          data: {
            message: 'El código ha expirado',
          },
        },
      });

    render(<ForgotPassword />);

    await user.type(
      screen.getByLabelText('Correo electrónico'),
      'usuario@gmail.com'
    );

    await user.click(
      screen.getByRole('button', { name: 'Enviar Código' })
    );

    await screen.findByText('✅ Código enviado a tu correo');

    await new Promise(resolve => setTimeout(resolve, 2100));

    await user.type(
      screen.getByLabelText('Código de 6 dígitos'),
      '123456'
    );

    await user.click(
      screen.getByRole('button', { name: 'Verificar Código' })
    );

    expect(
      await screen.findByText('El código ha expirado')
    ).toBeInTheDocument();
  }, 5000);

  it('shows fallback error when code verification fails without backend message', async () => {
    const user = userEvent.setup();

    mockPost
      .mockResolvedValueOnce({
        data: {
          success: true,
          token: 'recovery-token-123',
        },
      })
      .mockRejectedValueOnce(new Error('Network error'));

    render(<ForgotPassword />);

    await user.type(
      screen.getByLabelText('Correo electrónico'),
      'usuario@gmail.com'
    );

    await user.click(
      screen.getByRole('button', { name: 'Enviar Código' })
    );

    await screen.findByText('✅ Código enviado a tu correo');

    await new Promise(resolve => setTimeout(resolve, 2100));

    await user.type(
      screen.getByLabelText('Código de 6 dígitos'),
      '123456'
    );

    await user.click(
      screen.getByRole('button', { name: 'Verificar Código' })
    );

    expect(
      await screen.findByText('Código inválido')
    ).toBeInTheDocument();
  }, 5000);

  it('disables button while verifying code', async () => {
    const user = userEvent.setup();

    mockPost
      .mockResolvedValueOnce({
        data: {
          success: true,
          token: 'recovery-token-123',
        },
      })
      .mockImplementationOnce(() => new Promise(() => { }));

    render(<ForgotPassword />);

    await user.type(
      screen.getByLabelText('Correo electrónico'),
      'usuario@gmail.com'
    );

    await user.click(
      screen.getByRole('button', { name: 'Enviar Código' })
    );

    await screen.findByText('✅ Código enviado a tu correo');

    await new Promise(resolve => setTimeout(resolve, 2100));

    await user.type(
      screen.getByLabelText('Código de 6 dígitos'),
      '123456'
    );

    await user.click(
      screen.getByRole('button', { name: 'Verificar Código' })
    );

    expect(
      await screen.findByRole('button', { name: 'Verificando...' })
    ).toBeDisabled();
  }, 5000);

  it('submits new password successfully and navigates home', async () => {
    const user = userEvent.setup();

    mockPost
      .mockResolvedValueOnce({
        data: {
          success: true,
          token: 'recovery-token-123',
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
        },
      });

    render(<ForgotPassword />);

    await user.type(
      screen.getByLabelText('Correo electrónico'),
      'usuario@gmail.com'
    );

    await user.click(
      screen.getByRole('button', { name: 'Enviar Código' })
    );

    await screen.findByText('✅ Código enviado a tu correo');

    await new Promise(resolve => setTimeout(resolve, 2100));

    await user.type(
      screen.getByLabelText('Código de 6 dígitos'),
      '123456'
    );

    await user.click(
      screen.getByRole('button', { name: 'Verificar Código' })
    );

    await screen.findByText('✅ Código verificado');

    await new Promise(resolve => setTimeout(resolve, 1600));

    await user.type(
      screen.getByLabelText('Nueva contraseña'),
      'NuevaPassword123'
    );

    await user.click(
      screen.getByRole('button', { name: 'Cambiar Contraseña' })
    );

    expect(mockPost).toHaveBeenLastCalledWith(
      '/auth/reset-password',
      {
        token: 'recovery-token-123',
        code: '123456',
        newPassword: 'NuevaPassword123',
      }
    );

    expect(
      await screen.findByText('✅ Contraseña actualizada')
    ).toBeInTheDocument();

    await new Promise(resolve => setTimeout(resolve, 2100));

    expect(mockNavigate).toHaveBeenCalledWith('/');
  }, 12000);

  it('shows backend error when password reset fails', async () => {
    const user = userEvent.setup();

    mockPost
      .mockResolvedValueOnce({
        data: {
          success: true,
          token: 'recovery-token-123',
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
        },
      })
      .mockRejectedValueOnce({
        response: {
          data: {
            message: 'La contraseña no cumple los requisitos',
          },
        },
      });

    render(<ForgotPassword />);

    await user.type(
      screen.getByLabelText('Correo electrónico'),
      'usuario@gmail.com'
    );

    await user.click(
      screen.getByRole('button', { name: 'Enviar Código' })
    );

    await screen.findByText('✅ Código enviado a tu correo');

    await new Promise(resolve => setTimeout(resolve, 2100));

    await user.type(
      screen.getByLabelText('Código de 6 dígitos'),
      '123456'
    );

    await user.click(
      screen.getByRole('button', { name: 'Verificar Código' })
    );

    await screen.findByText('✅ Código verificado');

    await new Promise(resolve => setTimeout(resolve, 1600));

    await user.type(
      screen.getByLabelText('Nueva contraseña'),
      'NuevaPassword123'
    );

    await user.click(
      screen.getByRole('button', { name: 'Cambiar Contraseña' })
    );

    expect(
      await screen.findByText('La contraseña no cumple los requisitos')
    ).toBeInTheDocument();

    expect(mockNavigate).not.toHaveBeenCalled();
  }, 10000);

  it('usa el mensaje genérico cuando el error no tiene response', async () => {
    const user = userEvent.setup();

    mockPost
      .mockResolvedValueOnce({
        data: {
          success: true,
          token: 'recovery-token-123',
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
        },
      })
      .mockRejectedValueOnce({});

    render(<ForgotPassword />);

    await user.type(
      screen.getByLabelText('Correo electrónico'),
      'usuario@gmail.com'
    );

    await user.click(
      screen.getByRole('button', { name: 'Enviar Código' })
    );

    await screen.findByText('✅ Código enviado a tu correo');
    await new Promise(resolve => setTimeout(resolve, 2100));

    await user.type(
      screen.getByLabelText('Código de 6 dígitos'),
      '123456'
    );

    await user.click(
      screen.getByRole('button', { name: 'Verificar Código' })
    );

    await screen.findByText('✅ Código verificado');
    await new Promise(resolve => setTimeout(resolve, 1600));

    await user.type(
      screen.getByLabelText('Nueva contraseña'),
      'NuevaPassword123'
    );

    await user.click(
      screen.getByRole('button', { name: 'Cambiar Contraseña' })
    );

    expect(
      await screen.findByText('Error al restablecer contraseña')
    ).toBeInTheDocument();

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('disables button while updating password', async () => {
    const user = userEvent.setup();

    mockPost
      .mockResolvedValueOnce({
        data: {
          success: true,
          token: 'recovery-token-123',
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
        },
      })
      .mockImplementationOnce(() => new Promise(() => { }));

    render(<ForgotPassword />);

    await user.type(
      screen.getByLabelText('Correo electrónico'),
      'usuario@gmail.com'
    );

    await user.click(
      screen.getByRole('button', { name: 'Enviar Código' })
    );

    await screen.findByText('✅ Código enviado a tu correo');

    await new Promise(resolve => setTimeout(resolve, 2100));

    await user.type(
      screen.getByLabelText('Código de 6 dígitos'),
      '123456'
    );

    await user.click(
      screen.getByRole('button', { name: 'Verificar Código' })
    );

    await screen.findByText('✅ Código verificado');

    await new Promise(resolve => setTimeout(resolve, 1600));

    await user.type(
      screen.getByLabelText('Nueva contraseña'),
      'NuevaPassword123'
    );

    await user.click(
      screen.getByRole('button', { name: 'Cambiar Contraseña' })
    );

    expect(
      await screen.findByRole('button', { name: 'Actualizando...' })
    ).toBeDisabled();
  }, 10000);
});
