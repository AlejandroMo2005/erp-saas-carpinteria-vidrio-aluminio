import {
  calcularLuminosidad,
  esColorOscuro,
  obtenerBordeOptimo,
  obtenerEstiloLinea,
} from '@/presentation/components/Dashboard/Productos/Identificador';

describe('Identificador de luminosidad', () => {
  it('devuelve luminosidad por defecto para entrada inválida', () => {
    expect(calcularLuminosidad()).toBe(0.5);
    expect(calcularLuminosidad('rojo')).toBe(0.5);
  });

  it('calcula luminosidad para hex de 3 y 6 caracteres', () => {
    expect(calcularLuminosidad('#fff')).toBeCloseTo(1);
    expect(calcularLuminosidad('#ffffff')).toBeCloseTo(1);
    expect(calcularLuminosidad('#000000')).toBeCloseTo(0);
  });

  it('determina colores oscuros y claros', () => {
    expect(esColorOscuro('#000000')).toBe(true);
    expect(esColorOscuro('#ffffff')).toBe(false);
    expect(esColorOscuro('#777777', 0.5)).toBe(true);
  });

  it('obtiene el borde de contraste', () => {
    expect(obtenerBordeOptimo('#000000')).toBe('#ffffff');
    expect(obtenerBordeOptimo('#ffffff')).toBe('#000000');
  });

  it('aplica halo amarillo en alto contraste', () => {
    const estilo = obtenerEstiloLinea('#123456', true, true);

    expect(estilo.style.filter).toContain('#ffff00');
    expect(estilo.dot.stroke).toBe('#000000');
    expect(estilo.activeDot.stroke).toBe('#000000');
  });

  it('aplica halo negro para color claro en modo claro', () => {
    const estilo = obtenerEstiloLinea('#ffffff', false, false);

    expect(estilo.style.filter).toContain('#000000');
    expect(estilo.stroke).toBe('#ffffff');
  });

  it('aplica halo blanco para color muy oscuro en modo oscuro', () => {
    const estilo = obtenerEstiloLinea('#000000', true, false);

    expect(estilo.style.filter).toContain('#ffffff');
    expect(estilo.dot.stroke).toBe('#ffffff');
  });

  it('omite el filtro cuando existe contraste natural', () => {
    const estilo = obtenerEstiloLinea('#777777', true, false);

    expect(estilo.style).toBeUndefined();
  });

  it('configura grosor mayor para colores extremos', () => {
    expect(obtenerEstiloLinea('#000000').dot.strokeWidth).toBe(2.5);
    expect(obtenerEstiloLinea('#ffffff').dot.strokeWidth).toBe(2.5);
    expect(obtenerEstiloLinea('#888888').dot.strokeWidth).toBe(2);
  });

  it('exporta la configuración completa de la línea', () => {
    const estilo = obtenerEstiloLinea('#336699');

    expect(estilo).toMatchObject({
      stroke: '#336699',
      strokeWidth: 3.5,
      dot: {
        fill: '#336699',
        r: 4,
      },
      activeDot: {
        r: 6,
      },
    });
  });
});
