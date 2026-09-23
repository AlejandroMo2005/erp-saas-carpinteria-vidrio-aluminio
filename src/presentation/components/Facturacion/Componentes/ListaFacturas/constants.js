import { AlertCircle, FileText, CheckCircle, XCircle } from 'lucide-react';

export const ESTADO_CONFIG = {
  BORRADOR:      { label: 'Borrador',      color: 'gray',  Icon: AlertCircle },
  EMITIDA:       { label: 'Emitida',       color: 'blue',  Icon: FileText    },
  AUTORIZADA:    { label: 'Autorizada',    color: 'green', Icon: CheckCircle },
  ANULADA:       { label: 'Anulada',       color: 'red',   Icon: XCircle     },
  DEVUELTA:      { label: 'Devuelta',      color: 'gray',  Icon: AlertCircle },
  NO_AUTORIZADA: { label: 'No autorizada', color: 'red',   Icon: XCircle     },
};

export const FILTROS_INICIAL = {
  busqueda: '', estado: '', fechaDesde: '', fechaHasta: '',
};

export const PAGINACION_INICIAL = {
  pagina: 1, limite: 20, total: 0, totalPaginas: 0,
};