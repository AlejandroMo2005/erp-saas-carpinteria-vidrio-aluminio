import { Package, Layers, Wrench, Grid, Droplets, Box } from 'lucide-react';
import { iconoMaterial } from '@/presentation/components/Dashboard/Productos/constants';

describe('iconoMaterial', () => {
  it('devuelve Droplets para vidrio o cristal', () => {
    expect(iconoMaterial('Vidrio templado')).toBe(Droplets);
    expect(iconoMaterial('Cristal')).toBe(Droplets);
  });

  it('devuelve Layers para aluminio o perfil', () => {
    expect(iconoMaterial('Aluminio')).toBe(Layers);
    expect(iconoMaterial('Perfil estructural')).toBe(Layers);
  });

  it('devuelve Wrench para tornillos o herramientas', () => {
    expect(iconoMaterial('Tornillo')).toBe(Wrench);
    expect(iconoMaterial('Herramienta')).toBe(Wrench);
  });

  it('devuelve Box para silicona o sellador', () => {
    expect(iconoMaterial('Silicona')).toBe(Box);
    expect(iconoMaterial('Sellador')).toBe(Box);
  });

  it('devuelve Grid para panel o lámina', () => {
    expect(iconoMaterial('Panel')).toBe(Grid);
    expect(iconoMaterial('Lamina')).toBe(Grid);
  });

  it('devuelve Package para materiales no reconocidos', () => {
    expect(iconoMaterial()).toBe(Package);
    expect(iconoMaterial('Madera')).toBe(Package);
  });
});
