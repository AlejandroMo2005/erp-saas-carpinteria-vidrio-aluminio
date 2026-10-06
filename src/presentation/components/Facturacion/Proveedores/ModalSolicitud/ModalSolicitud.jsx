import { X, MessageCircle, Copy, Check, Phone } from 'lucide-react';
import useModalSolicitud from './useModalSolicitud';
import './ModalSolicitud.css';

export default function ModalSolicitud({
  _proveedor_id,
  nombreProveedor,
  telefono_whatsapp,
  plantilla,
  solicitudId,
  onClose,
  onEnviada,
}) {
  const {
    paso,
    copiado,
    marcando,
    telMostrar,
    tieneTel,
    handleCopiarYEnviar,
    handleCopiarManual,
    handleConfirmar,
  } = useModalSolicitud({ plantilla, solicitudId, telefono_whatsapp, onEnviada });

  return (
    <div
      className="msol-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="msol-titulo"
    >
      <div className="msol-modal">

        {/* Header */}
        <div className="msol-header">
          <div className="msol-header__info">
            <MessageCircle size={20} aria-hidden="true" />
            <div>
              <h2 id="msol-titulo" className="msol-title">
                Solicitud de materiales
              </h2>
              <p className="msol-subtitle">Para: {nombreProveedor}</p>
            </div>
          </div>
          <button
            type="button"
            className="msol-close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Vista previa */}
        <div className="msol-body">
          <h3 id="msol-preview-label" className="msol-preview-heading">
            Vista previa del mensaje
          </h3>
          <pre
            className="msol-plantilla"
            aria-labelledby="msol-preview-label"
          >
            {plantilla}
          </pre>
        </div>

        {/* Instrucciones post-copia */}
        {paso === 'instrucciones' && (
          <div
            className="msol-instruccion"
            role="status"
            aria-live="polite"
          >
            <p className="msol-instruccion__titulo">
              ✅ Mensaje copiado — 3 pasos:
            </p>
            <ol className="msol-instruccion__lista">
              <li>Ve a tu pestaña de <strong>WhatsApp Web</strong></li>
              <li>
                Abre el chat de
                {telMostrar
                  ? (
                    <span className="msol-instruccion__tel">
                      <Phone size={13} aria-hidden="true" />
                      {telMostrar}
                    </span>
                  )
                  : <strong> {nombreProveedor}</strong>
                }
              </li>
              <li>Pega con <kbd>Ctrl</kbd>+<kbd>V</kbd> y envía</li>
            </ol>
          </div>
        )}

        {paso === 'confirmado' && (
          <div
            className="msol-instruccion msol-instruccion--ok"
            role="status"
          >
            ✅ Solicitud marcada como enviada.
          </div>
        )}

        {/* Footer */}
        <div className="msol-footer">

          <button
            type="button"
            className="msol-btn msol-btn--secondary"
            onClick={onClose}
          >
            Cerrar
          </button>

          <button
            type="button"
            className="msol-btn msol-btn--ghost"
            onClick={handleCopiarManual}
          >
            {copiado
              ? <Check size={16} aria-hidden="true" />
              : <Copy size={16} aria-hidden="true" />
            }
            {copiado ? 'Copiado' : 'Copiar'}
          </button>

          {tieneTel && paso === null && (
            <button
              type="button"
              className="msol-btn msol-btn--wt"
              onClick={handleCopiarYEnviar}
            >
              <Copy size={16} aria-hidden="true" />
              Copiar y enviar
            </button>
          )}

          {paso === 'instrucciones' && (
            <button
              type="button"
              className="msol-btn msol-btn--confirmar"
              onClick={handleConfirmar}
              disabled={marcando}
            >
              <Check size={16} aria-hidden="true" />
              {marcando ? 'Guardando…' : 'Ya lo envié ✓'}
            </button>
          )}

          {paso === 'confirmado' && (
            <button
              type="button"
              className="msol-btn msol-btn--enviada"
              disabled
            >
              <Check size={16} aria-hidden="true" />
              Enviado ✓
            </button>
          )}

          {!tieneTel && paso === null && (
            <p className="msol-sin-tel">
              Sin número registrado. Copia el mensaje y envíalo manualmente.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
