// src/presentation/components/Pedidos/VisualizadorModal/constants.js
import { lazy } from 'react';

export const PREVIEW_MAP = {
  'Ventanas':          lazy(() => import('../../Previsualizacion/previews/Ventana/VentanaPreview')),
  'Puertas':           lazy(() => import('../../Previsualizacion/previews/Puerta/PuertaPreview')),
  'Puertas de Baño':   lazy(() => import('../../Previsualizacion/previews/PuertaBano/PuertaBanoPreview')),
  'Balcones':          lazy(() => import('../../Previsualizacion/previews/Balcon/BalconPreview')),
  'Vitrinas':          lazy(() => import('../../Previsualizacion/previews/Vitrina/VitrinaPreview')),
  'Puertas de Cocina': lazy(() => import('../../Previsualizacion/previews/PuertaCocina/PuertaCocinaPreview')),
  'Anaqueles':         lazy(() => import('../../Previsualizacion/previews/Anaquel/AnaquelPreview')),
  'Cielo Raso':        lazy(() => import('../../Previsualizacion/previews/CieloRaso/CieloRasoPreview')),
  'Vidrios Templados': lazy(() => import('../../Previsualizacion/previews/VidrioTemplado/VidrioTempladoPreview')),
  'Cortinas de Baño':  lazy(() => import('../../Previsualizacion/previews/CortinasBano/CortinasBanoPreview')),
};

// Mapa de nombres de color (API) → valor hex para el canvas R3F
export const HEX_COLORES = {
  'Blanco':            '#FFFFFF',
  'Negro':             '#1A1A1A',
  'Gris Oxford':       '#808080',
  'Madera':            '#8B4513',
  'Bronce':            '#CD7F32',
  'Natural':           '#E0E0E0',
  'Vidrio Claro':      '#e0f2ff',
  'Vidrio Azul':       '#6eb5ff',
  'Vidrio Bronce':     '#cd9b70',
  'Vidrio Gris':       '#b0b0b0',
  'Vidrio Reflectivo': '#708090',
};