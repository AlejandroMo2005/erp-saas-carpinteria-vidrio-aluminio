import { useToasts } from '../../../hooks/useToasts';

export function usePedidoToasts() {
  return useToasts({
    duracion: 4000,
    tipoPorDefecto: 'info',
    helpers: true,
  });
}
