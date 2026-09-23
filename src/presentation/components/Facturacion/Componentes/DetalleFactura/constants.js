import { Clock, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export const CONFIG_ESTADO = {
  BORRADOR:      { label: 'Borrador',       color: 'gray',   Icon: Clock       },
  EMITIDA:       { label: 'Emitida',        color: 'blue',   Icon: FileText    },
  AUTORIZADA:    { label: 'Autorizada',     color: 'green',  Icon: CheckCircle },
  ANULADA:       { label: 'Anulada',        color: 'red',    Icon: XCircle     },
  DEVUELTA:      { label: 'Devuelta',       color: 'yellow', Icon: AlertCircle },
  NO_AUTORIZADA: { label: 'No autorizada',  color: 'red',    Icon: XCircle     },
};

export const CONFIG_ESTADO_SRI = {
  SIN_ENVIAR:    { label: 'Sin enviar',     color: 'white'  },
  PENDIENTE:     { label: 'Pendiente',      color: 'yellow' },
  RECIBIDA:      { label: 'Recibida',       color: 'blue'   },
  AUTORIZADA:    { label: 'Autorizada',     color: 'green'  },
  DEVUELTA:      { label: 'Devuelta',       color: 'yellow' },
  NO_AUTORIZADA: { label: 'No autorizada',  color: 'red'    },
};