import { useToasts } from '../../../../hooks/useToasts';

export function usePreviewToasts() {
  return useToasts({
    duracion: 3500,
    tipoPorDefecto: 'info',
    helpers: true,
  });
}
