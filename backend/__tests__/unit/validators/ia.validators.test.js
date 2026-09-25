import {
  inpaintSchema,
  visualizarSchema,
} from '../../../src/shared/validators/ia.validators';

describe('ia.validators', () => {
  describe('inpaintSchema', () => {
    const datosValidos = {
      imagen: 'base64-image-data',
      mascara: 'base64-mask-data',
      prompt: 'Ventana moderna de aluminio',
    };

    test('debe aceptar datos mínimos válidos', () => {
      const result = inpaintSchema.safeParse(datosValidos);

      expect(result.success).toBe(true);
      expect(result.data.imagen).toBe('base64-image-data');
      expect(result.data.mascara).toBe('base64-mask-data');
      expect(result.data.prompt).toBe('Ventana moderna de aluminio');
    });

    test('debe aplicar trim al prompt', () => {
      const result = inpaintSchema.safeParse({
        ...datosValidos,
        prompt: '  Ventana moderna  ',
      });

      expect(result.success).toBe(true);
      expect(result.data.prompt).toBe('Ventana moderna');
    });

    test('debe rechazar imagen ausente', () => {
      const { imagen, ...datos } = datosValidos;

      const result = inpaintSchema.safeParse(datos);

      expect(result.success).toBe(false);
    });

    test('debe rechazar imagen vacía', () => {
      const result = inpaintSchema.safeParse({
        ...datosValidos,
        imagen: '',
      });

      expect(result.success).toBe(false);
    });

    test('debe rechazar mascara ausente', () => {
      const { mascara, ...datos } = datosValidos;

      const result = inpaintSchema.safeParse(datos);

      expect(result.success).toBe(false);
    });

    test('debe rechazar mascara vacía', () => {
      const result = inpaintSchema.safeParse({
        ...datosValidos,
        mascara: '',
      });

      expect(result.success).toBe(false);
    });

    test('debe rechazar prompt ausente', () => {
      const { prompt, ...datos } = datosValidos;

      const result = inpaintSchema.safeParse(datos);

      expect(result.success).toBe(false);
    });

    test('debe rechazar prompt vacío', () => {
      const result = inpaintSchema.safeParse({
        ...datosValidos,
        prompt: '',
      });

      expect(result.success).toBe(false);
    });

    test('debe rechazar prompt compuesto únicamente por espacios', () => {
      const result = inpaintSchema.safeParse({
        ...datosValidos,
        prompt: '     ',
      });

      expect(result.success).toBe(false);
    });

    test('debe aceptar prompt de exactamente 500 caracteres', () => {
      const result = inpaintSchema.safeParse({
        ...datosValidos,
        prompt: 'a'.repeat(500),
      });

      expect(result.success).toBe(true);
      expect(result.data.prompt).toHaveLength(500);
    });

    test('debe rechazar prompt de más de 500 caracteres', () => {
      const result = inpaintSchema.safeParse({
        ...datosValidos,
        prompt: 'a'.repeat(501),
      });

      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe(
        'El prompt no puede superar 500 caracteres'
      );
    });

    test('debe aplicar cadena vacía por defecto a prompt_negativo', () => {
      const result = inpaintSchema.safeParse(datosValidos);

      expect(result.success).toBe(true);
      expect(result.data.prompt_negativo).toBe('');
    });

    test('debe aceptar prompt_negativo válido', () => {
      const result = inpaintSchema.safeParse({
        ...datosValidos,
        prompt_negativo: 'sin personas',
      });

      expect(result.success).toBe(true);
      expect(result.data.prompt_negativo).toBe('sin personas');
    });

    test('debe aplicar trim a prompt_negativo', () => {
      const result = inpaintSchema.safeParse({
        ...datosValidos,
        prompt_negativo: '  sin personas  ',
      });

      expect(result.success).toBe(true);
      expect(result.data.prompt_negativo).toBe('sin personas');
    });

    test('debe aceptar prompt_negativo de exactamente 500 caracteres', () => {
      const result = inpaintSchema.safeParse({
        ...datosValidos,
        prompt_negativo: 'a'.repeat(500),
      });

      expect(result.success).toBe(true);
      expect(result.data.prompt_negativo).toHaveLength(500);
    });

    test('debe rechazar prompt_negativo de más de 500 caracteres', () => {
      const result = inpaintSchema.safeParse({
        ...datosValidos,
        prompt_negativo: 'a'.repeat(501),
      });

      expect(result.success).toBe(false);
    });

    test('debe aceptar trabajo válido', () => {
      const result = inpaintSchema.safeParse({
        ...datosValidos,
        trabajo: 'Ventana',
      });

      expect(result.success).toBe(true);
      expect(result.data.trabajo).toBe('Ventana');
    });

    test('debe aceptar trabajo como null', () => {
      const result = inpaintSchema.safeParse({
        ...datosValidos,
        trabajo: null,
      });

      expect(result.success).toBe(true);
      expect(result.data.trabajo).toBeNull();
    });

    test('debe rechazar trabajo mayor a 100 caracteres', () => {
      const result = inpaintSchema.safeParse({
        ...datosValidos,
        trabajo: 'a'.repeat(101),
      });

      expect(result.success).toBe(false);
    });

    test('debe aceptar color_marco válido', () => {
      const result = inpaintSchema.safeParse({
        ...datosValidos,
        color_marco: 'Negro',
      });

      expect(result.success).toBe(true);
      expect(result.data.color_marco).toBe('Negro');
    });

    test('debe aceptar color_marco como null', () => {
      const result = inpaintSchema.safeParse({
        ...datosValidos,
        color_marco: null,
      });

      expect(result.success).toBe(true);
      expect(result.data.color_marco).toBeNull();
    });

    test('debe rechazar color_marco mayor a 20 caracteres', () => {
      const result = inpaintSchema.safeParse({
        ...datosValidos,
        color_marco: 'a'.repeat(21),
      });

      expect(result.success).toBe(false);
    });

    test('debe aceptar color_vidrio válido', () => {
      const result = inpaintSchema.safeParse({
        ...datosValidos,
        color_vidrio: 'Transparente',
      });

      expect(result.success).toBe(true);
      expect(result.data.color_vidrio).toBe('Transparente');
    });

    test('debe aceptar color_vidrio como null', () => {
      const result = inpaintSchema.safeParse({
        ...datosValidos,
        color_vidrio: null,
      });

      expect(result.success).toBe(true);
      expect(result.data.color_vidrio).toBeNull();
    });

    test('debe rechazar color_vidrio mayor a 20 caracteres', () => {
      const result = inpaintSchema.safeParse({
        ...datosValidos,
        color_vidrio: 'a'.repeat(21),
      });

      expect(result.success).toBe(false);
    });

    test('debe rechazar tipos incorrectos en campos principales', () => {
      const result = inpaintSchema.safeParse({
        imagen: 123,
        mascara: 123,
        prompt: 123,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('visualizarSchema', () => {
    describe('validación estructural', () => {
      test('debe aceptar datos válidos en modo catálogo', () => {
        const result = visualizarSchema.safeParse({
          trabajo_id: '10',
          color_id: '5',
        });

        expect(result.success).toBe(true);
        expect(result.data.trabajo_id).toBe(10);
        expect(result.data.color_id).toBe(5);
        expect(result.data.prompt_libre).toBe('');
      });

      test('debe aceptar datos válidos en modo libre', () => {
        const result = visualizarSchema.safeParse({
          trabajo_id: '0',
          color_id: '0',
          prompt_libre: 'Ventana corrediza moderna',
        });

        expect(result.success).toBe(true);
        expect(result.data.trabajo_id).toBe(0);
        expect(result.data.color_id).toBe(0);
        expect(result.data.prompt_libre).toBe(
          'Ventana corrediza moderna'
        );
      });

      test('debe transformar trabajo_id de string a número', () => {
        const result = visualizarSchema.safeParse({
          trabajo_id: '25',
          color_id: '7',
        });

        expect(result.success).toBe(true);
        expect(result.data.trabajo_id).toBe(25);
        expect(typeof result.data.trabajo_id).toBe('number');
      });

      test('debe transformar color_id de string a número', () => {
        const result = visualizarSchema.safeParse({
          trabajo_id: '25',
          color_id: '7',
        });

        expect(result.success).toBe(true);
        expect(result.data.color_id).toBe(7);
        expect(typeof result.data.color_id).toBe('number');
      });

      test('debe aplicar prompt_libre vacío por defecto', () => {
        const result = visualizarSchema.safeParse({
          trabajo_id: '10',
          color_id: '5',
        });

        expect(result.success).toBe(true);
        expect(result.data.prompt_libre).toBe('');
      });

      test('debe aplicar trim a prompt_libre', () => {
        const result = visualizarSchema.safeParse({
          trabajo_id: '0',
          color_id: '0',
          prompt_libre: '  Ventana moderna  ',
        });

        expect(result.success).toBe(true);
        expect(result.data.prompt_libre).toBe('Ventana moderna');
      });

      test('debe rechazar trabajo_id ausente', () => {
        const result = visualizarSchema.safeParse({
          color_id: '5',
        });

        expect(result.success).toBe(false);
      });

      test('debe rechazar color_id ausente', () => {
        const result = visualizarSchema.safeParse({
          trabajo_id: '10',
        });

        expect(result.success).toBe(false);
      });

      test('debe rechazar trabajo_id no numérico', () => {
        const result = visualizarSchema.safeParse({
          trabajo_id: 'abc',
          color_id: '5',
        });

        expect(result.success).toBe(false);
      });

      test('debe rechazar color_id no numérico', () => {
        const result = visualizarSchema.safeParse({
          trabajo_id: '10',
          color_id: 'abc',
        });

        expect(result.success).toBe(false);
      });

      test('debe rechazar trabajo_id con formato decimal', () => {
        const result = visualizarSchema.safeParse({
          trabajo_id: '10.5',
          color_id: '5',
        });

        expect(result.success).toBe(false);
      });

      test('debe rechazar color_id con formato decimal', () => {
        const result = visualizarSchema.safeParse({
          trabajo_id: '10',
          color_id: '5.5',
        });

        expect(result.success).toBe(false);
      });

      test('debe aceptar cero como string para trabajo_id', () => {
        const result = visualizarSchema.safeParse({
          trabajo_id: '0',
          color_id: '0',
          prompt_libre: 'Descripción válida',
        });

        expect(result.success).toBe(true);
        expect(result.data.trabajo_id).toBe(0);
      });

      test('debe aceptar cero como string para color_id en modo libre', () => {
        const result = visualizarSchema.safeParse({
          trabajo_id: '0',
          color_id: '0',
          prompt_libre: 'Descripción válida',
        });

        expect(result.success).toBe(true);
        expect(result.data.color_id).toBe(0);
      });

      test('debe rechazar valores negativos por el regex', () => {
        const result = visualizarSchema.safeParse({
          trabajo_id: '-1',
          color_id: '5',
        });

        expect(result.success).toBe(false);
      });
    });

    describe('modo catálogo', () => {
      test('debe aceptar trabajo_id mayor que cero y color_id mayor que cero', () => {
        const result = visualizarSchema.safeParse({
          trabajo_id: '10',
          color_id: '20',
        });

        expect(result.success).toBe(true);
      });

      test('debe rechazar color_id cero en modo catálogo', () => {
        const result = visualizarSchema.safeParse({
          trabajo_id: '10',
          color_id: '0',
        });

        expect(result.success).toBe(false);

        const issue = result.error.issues.find(
          (item) => item.path[0] === 'color_id'
        );

        expect(issue?.message).toBe(
          'color_id es requerido en modo catálogo'
        );
      });

      test('debe permitir prompt_libre vacío en modo catálogo', () => {
        const result = visualizarSchema.safeParse({
          trabajo_id: '10',
          color_id: '5',
          prompt_libre: '',
        });

        expect(result.success).toBe(true);
      });

      test('debe permitir prompt_libre aunque exista en modo catálogo', () => {
        const result = visualizarSchema.safeParse({
          trabajo_id: '10',
          color_id: '5',
          prompt_libre: 'Ventana personalizada',
        });

        expect(result.success).toBe(true);
      });
    });

    describe('modo libre', () => {
      test('debe aceptar prompt_libre de exactamente 5 caracteres', () => {
        const result = visualizarSchema.safeParse({
          trabajo_id: '0',
          color_id: '0',
          prompt_libre: 'abcde',
        });

        expect(result.success).toBe(true);
      });

      test('debe aceptar prompt_libre mayor a 5 caracteres', () => {
        const result = visualizarSchema.safeParse({
          trabajo_id: '0',
          color_id: '0',
          prompt_libre: 'Ventana moderna',
        });

        expect(result.success).toBe(true);
      });

      test('debe rechazar prompt_libre ausente en modo libre', () => {
        const result = visualizarSchema.safeParse({
          trabajo_id: '0',
          color_id: '0',
        });

        expect(result.success).toBe(false);

        const issue = result.error.issues.find(
          (item) => item.path[0] === 'prompt_libre'
        );

        expect(issue?.message).toBe(
          'El prompt libre es requerido en modo descripción libre (mín. 5 caracteres)'
        );
      });

      test('debe rechazar prompt_libre vacío en modo libre', () => {
        const result = visualizarSchema.safeParse({
          trabajo_id: '0',
          color_id: '0',
          prompt_libre: '',
        });

        expect(result.success).toBe(false);
      });

      test('debe rechazar prompt_libre menor a 5 caracteres', () => {
        const result = visualizarSchema.safeParse({
          trabajo_id: '0',
          color_id: '0',
          prompt_libre: 'abcd',
        });

        expect(result.success).toBe(false);
      });

      test('debe rechazar prompt_libre compuesto solo por espacios', () => {
        const result = visualizarSchema.safeParse({
          trabajo_id: '0',
          color_id: '0',
          prompt_libre: '    ',
        });

        expect(result.success).toBe(false);
      });

      test('debe aceptar prompt_libre de exactamente 500 caracteres', () => {
        const result = visualizarSchema.safeParse({
          trabajo_id: '0',
          color_id: '0',
          prompt_libre: 'a'.repeat(500),
        });

        expect(result.success).toBe(true);
      });

      test('debe rechazar prompt_libre mayor a 500 caracteres', () => {
        const result = visualizarSchema.safeParse({
          trabajo_id: '0',
          color_id: '0',
          prompt_libre: 'a'.repeat(501),
        });

        expect(result.success).toBe(false);
      });
    });
  });
});