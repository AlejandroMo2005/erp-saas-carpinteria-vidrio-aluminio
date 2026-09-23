// src/presentation/components/common/ErrorBoundary.jsx
// Sprint 17 — Error boundary por módulo.
// Sprint 18 — Inline styles → ErrorBoundary.css
// Si un módulo lazy lanza en runtime, solo ese módulo
// muestra el fallback — el resto de la app sigue funcionando.

import { Component } from 'react';
import './ErrorBoundary.css';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // En producción aquí iría el reporte a Sentry/LogRocket/etc.
    console.error(`[ErrorBoundary:${this.props.modulo ?? 'módulo'}]`, error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const modulo = this.props.modulo ?? 'este módulo';

    return (
      <div className="error-boundary">
        <span className="error-boundary__icon" aria-hidden="true">⚠️</span>
        <h2 className="error-boundary__title">Error en {modulo}</h2>
        <p className="error-boundary__message">
          Algo salió mal al cargar este módulo. El resto de la aplicación
          sigue funcionando con normalidad.
        </p>
        <button className="error-boundary__btn" onClick={this.handleReset}>
          Reintentar
        </button>
      </div>
    );
  }
}