import { useToasts as useSharedToasts } from '../../../hooks/useToasts';

export function useToasts() {
  return useSharedToasts({
    duracion: 3500,
    tipoPorDefecto: 'success',
  });
}
