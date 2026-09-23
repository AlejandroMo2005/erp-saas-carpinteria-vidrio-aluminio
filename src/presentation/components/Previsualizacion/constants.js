// src/presentation/components/Previsualizacion/constants.js
import { lazy } from 'react';

export const PREVIEW_MAP = {
  'Ventanas':          lazy(() => import('./previews/Ventana/VentanaPreview')),
  'Puertas':           lazy(() => import('./previews/Puerta/PuertaPreview')),
  'Puertas de Baño':   lazy(() => import('./previews/PuertaBano/PuertaBanoPreview')),
  'Balcones':          lazy(() => import('./previews/Balcon/BalconPreview')),
  'Vitrinas':          lazy(() => import('./previews/Vitrina/VitrinaPreview')),
  'Puertas de Cocina': lazy(() => import('./previews/PuertaCocina/PuertaCocinaPreview')),
  'Anaqueles':         lazy(() => import('./previews/Anaquel/AnaquelPreview')),
  'Cielo Raso':        lazy(() => import('./previews/CieloRaso/CieloRasoPreview')),
  'Vidrios Templados': lazy(() => import('./previews/VidrioTemplado/VidrioTempladoPreview')),
  'Cortinas de Baño':  lazy(() => import('./previews/CortinasBano/CortinasBanoPreview')),
};