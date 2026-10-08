import { useToasts } from '../../../hooks/useToasts';

export function useProformaToasts() {
  return useToasts({
    duracion: 4000,
    tipoPorDefecto: 'info',
    helpers: true,
  });
}
