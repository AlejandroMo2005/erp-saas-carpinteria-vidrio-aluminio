import { Package, Layers, Wrench, Grid, Droplets, Box } from 'lucide-react';

export function iconoMaterial(nombre = '') {
  const n = nombre.toLowerCase();
  if (n.includes('vidrio') || n.includes('cristal')) return Droplets;
  if (n.includes('alumin') || n.includes('perfil')) return Layers;
  if (n.includes('tornill') || n.includes('herram')) return Wrench;
  if (n.includes('silico') || n.includes('sellad')) return Box;
  if (n.includes('panel') || n.includes('lamina')) return Grid;
  return Package;
}