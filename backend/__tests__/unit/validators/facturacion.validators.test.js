import {
  crearFacturaManualSchema,
  crearDesdePedidoSchema,
  actualizarFacturaSchema,
  anularFacturaSchema,
} from '../../../src/shared/validators/facturacion.validators';

describe('facturacion.validators', () => {
  describe('itemFacturaSchema mediante crearFacturaManualSchema', () => {
    const itemValido = {
      descripcion: 'Ventana de aluminio',
      cantidad: 2,
    };

    test('debe aceptar un item mínimo válido', () => {
      const result = crearFacturaManualSchema.safeParse({
        cliente_nombre: 'Juan Pérez',
        items: [itemValido],
      });

      expect(result.success).toBe(true);
      expect(result.data.items[0]).toMatchObject({
        descripcion: 'Ventana de aluminio',
        cantidad: 2,
        precio_unitario: 0,
        descuento: 0,
      });
    });

    test('debe aplicar trim a la descripción', () => {
      const result = crearFacturaManualSchema.safeParse({
        cliente_nombre: 'Juan Pérez',
        items: [
          {
            ...itemValido,
            descripcion: '  Ventana de aluminio  ',
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.items[0].descripcion).toBe(
        'Ventana de aluminio'
      );
    });

    test('debe rechazar descripción vacía', () => {
      const result = crearFacturaManualSchema.safeParse({
        cliente_nombre: 'Juan Pérez',
        items: [
          {
            ...itemValido,
            descripcion: '',
          },
        ],
      });

      expect(result.success).toBe(false);
    });

    test('debe rechazar descripción que exceda 300 caracteres', () => {
      const result = crearFacturaManualSchema.safeParse({
        cliente_nombre: 'Juan Pérez',
        items: [
          {
            ...itemValido,
            descripcion: 'a'.repeat(301),
          },
        ],
      });

      expect(result.success).toBe(false);
    });

    test('debe rechazar cantidad cero', () => {
      const result = crearFacturaManualSchema.safeParse({
        cliente_nombre: 'Juan Pérez',
        items: [
          {
            ...itemValido,
            cantidad: 0,
          },
        ],
      });

      expect(result.success).toBe(false);
    });

    test('debe rechazar cantidad negativa', () => {
      const result = crearFacturaManualSchema.safeParse({
        cliente_nombre: 'Juan Pérez',
        items: [
          {
            ...itemValido,
            cantidad: -1,
          },
        ],
      });

      expect(result.success).toBe(false);
    });

    test('debe rechazar cantidad que no sea número', () => {
      const result = crearFacturaManualSchema.safeParse({
        cliente_nombre: 'Juan Pérez',
        items: [
          {
            ...itemValido,
            cantidad: '2',
          },
        ],
      });

      expect(result.success).toBe(false);
    });

    test('debe aceptar precio unitario y descuento no negativos', () => {
      const result = crearFacturaManualSchema.safeParse({
        cliente_nombre: 'Juan Pérez',
        items: [
          {
            ...itemValido,
            precio_unitario: 25.5,
            descuento: 2,
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.items[0].precio_unitario).toBe(25.5);
      expect(result.data.items[0].descuento).toBe(2);
    });

    test('debe rechazar precio unitario negativo', () => {
      const result = crearFacturaManualSchema.safeParse({
        cliente_nombre: 'Juan Pérez',
        items: [
          {
            ...itemValido,
            precio_unitario: -1,
          },
        ],
      });

      expect(result.success).toBe(false);
    });

    test('debe rechazar descuento negativo', () => {
      const result = crearFacturaManualSchema.safeParse({
        cliente_nombre: 'Juan Pérez',
        items: [
          {
            ...itemValido,
            descuento: -1,
          },
        ],
      });

      expect(result.success).toBe(false);
    });

    test('debe aceptar porcentaje de IVA no negativo', () => {
      const result = crearFacturaManualSchema.safeParse({
        cliente_nombre: 'Juan Pérez',
        items: [
          {
            ...itemValido,
            porcentaje_iva: 15,
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.items[0].porcentaje_iva).toBe(15);
    });

    test('debe rechazar porcentaje de IVA negativo', () => {
      const result = crearFacturaManualSchema.safeParse({
        cliente_nombre: 'Juan Pérez',
        items: [
          {
            ...itemValido,
            porcentaje_iva: -1,
          },
        ],
      });

      expect(result.success).toBe(false);
    });

    test('debe aceptar material_id entero positivo', () => {
      const result = crearFacturaManualSchema.safeParse({
        cliente_nombre: 'Juan Pérez',
        items: [
          {
            ...itemValido,
            material_id: 10,
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.items[0].material_id).toBe(10);
    });

    test('debe aceptar material_id null', () => {
      const result = crearFacturaManualSchema.safeParse({
        cliente_nombre: 'Juan Pérez',
        items: [
          {
            ...itemValido,
            material_id: null,
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.items[0].material_id).toBeNull();
    });

    test('debe rechazar material_id decimal', () => {
      const result = crearFacturaManualSchema.safeParse({
        cliente_nombre: 'Juan Pérez',
        items: [
          {
            ...itemValido,
            material_id: 10.5,
          },
        ],
      });

      expect(result.success).toBe(false);
    });

    test('debe aceptar detalles_adicionales', () => {
      const result = crearFacturaManualSchema.safeParse({
        cliente_nombre: 'Juan Pérez',
        items: [
          {
            ...itemValido,
            detalles_adicionales: 'Color negro mate',
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.items[0].detalles_adicionales).toBe(
        'Color negro mate'
      );
    });

    test('debe aceptar detalles_adicionales como null', () => {
      const result = crearFacturaManualSchema.safeParse({
        cliente_nombre: 'Juan Pérez',
        items: [
          {
            ...itemValido,
            detalles_adicionales: null,
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.items[0].detalles_adicionales).toBeNull();
    });

    test('debe rechazar detalles_adicionales mayores a 500 caracteres', () => {
      const result = crearFacturaManualSchema.safeParse({
        cliente_nombre: 'Juan Pérez',
        items: [
          {
            ...itemValido,
            detalles_adicionales: 'a'.repeat(501),
          },
        ],
      });

      expect(result.success).toBe(false);
    });
  });

  describe('crearFacturaManualSchema', () => {
    const facturaValida = {
      cliente_nombre: '  Juan Pérez  ',
      items: [
        {
          descripcion: 'Ventana',
          cantidad: 1,
        },
      ],
    };

    test('debe aceptar una factura manual válida', () => {
      const result = crearFacturaManualSchema.safeParse(facturaValida);

      expect(result.success).toBe(true);
      expect(result.data.cliente_nombre).toBe('Juan Pérez');
    });

    test('debe rechazar cliente_nombre ausente', () => {
      const result = crearFacturaManualSchema.safeParse({
        items: facturaValida.items,
      });

      expect(result.success).toBe(false);
    });

    test('debe rechazar cliente_nombre vacío', () => {
      const result = crearFacturaManualSchema.safeParse({
        ...facturaValida,
        cliente_nombre: '   ',
      });

      expect(result.success).toBe(false);
    });

    test('debe rechazar cliente_nombre mayor a 200 caracteres', () => {
      const result = crearFacturaManualSchema.safeParse({
        ...facturaValida,
        cliente_nombre: 'a'.repeat(201),
      });

      expect(result.success).toBe(false);
    });

    test('debe rechazar items ausente', () => {
      const result = crearFacturaManualSchema.safeParse({
        cliente_nombre: 'Juan Pérez',
      });

      expect(result.success).toBe(false);
    });

    test('debe rechazar items vacío', () => {
      const result = crearFacturaManualSchema.safeParse({
        cliente_nombre: 'Juan Pérez',
        items: [],
      });

      expect(result.success).toBe(false);
    });

    test('debe aceptar cliente_id entero positivo', () => {
      const result = crearFacturaManualSchema.safeParse({
        ...facturaValida,
        cliente_id: 5,
      });

      expect(result.success).toBe(true);
      expect(result.data.cliente_id).toBe(5);
    });

    test('debe aceptar cliente_id null', () => {
      const result = crearFacturaManualSchema.safeParse({
        ...facturaValida,
        cliente_id: null,
      });

      expect(result.success).toBe(true);
      expect(result.data.cliente_id).toBeNull();
    });

    test('debe rechazar cliente_id cero', () => {
      const result = crearFacturaManualSchema.safeParse({
        ...facturaValida,
        cliente_id: 0,
      });

      expect(result.success).toBe(false);
    });

    test('debe rechazar cliente_id decimal', () => {
      const result = crearFacturaManualSchema.safeParse({
        ...facturaValida,
        cliente_id: 5.5,
      });

      expect(result.success).toBe(false);
    });

    test.each([
      'CONSUMIDOR_FINAL',
      'CEDULA',
      'RUC',
      'PASAPORTE',
    ])('debe aceptar tipo de identificación %s', (tipo) => {
      const result = crearFacturaManualSchema.safeParse({
        ...facturaValida,
        cliente_tipo_identificacion: tipo,
      });

      expect(result.success).toBe(true);
      expect(result.data.cliente_tipo_identificacion).toBe(tipo);
    });

    test('debe aplicar CONSUMIDOR_FINAL por defecto', () => {
      const result = crearFacturaManualSchema.safeParse(facturaValida);

      expect(result.success).toBe(true);
      expect(result.data.cliente_tipo_identificacion).toBe(
        'CONSUMIDOR_FINAL'
      );
    });

    test('debe rechazar tipo de identificación inválido', () => {
      const result = crearFacturaManualSchema.safeParse({
        ...facturaValida,
        cliente_tipo_identificacion: 'DNI',
      });

      expect(result.success).toBe(false);
    });

    test('debe aceptar cliente_identificacion null y string válido', () => {
      const result = crearFacturaManualSchema.safeParse({
        ...facturaValida,
        cliente_identificacion: '1312345678',
      });

      expect(result.success).toBe(true);
      expect(result.data.cliente_identificacion).toBe('1312345678');
    });

    test('debe rechazar cliente_identificacion mayor a 20 caracteres', () => {
      const result = crearFacturaManualSchema.safeParse({
        ...facturaValida,
        cliente_identificacion: 'a'.repeat(21),
      });

      expect(result.success).toBe(false);
    });

    test('debe aceptar dirección, teléfono y correo válidos', () => {
      const result = crearFacturaManualSchema.safeParse({
        ...facturaValida,
        cliente_direccion: 'Av. Principal 123',
        cliente_telefono: '0991234567',
        cliente_email: 'cliente@example.com',
      });

      expect(result.success).toBe(true);
    });

    test('debe rechazar correo inválido', () => {
      const result = crearFacturaManualSchema.safeParse({
        ...facturaValida,
        cliente_email: 'correo-invalido',
      });

      expect(result.success).toBe(false);
    });

    test('debe aceptar pedido_id positivo y observaciones', () => {
      const result = crearFacturaManualSchema.safeParse({
        ...facturaValida,
        pedido_id: 20,
        observaciones: 'Entrega en domicilio',
      });

      expect(result.success).toBe(true);
      expect(result.data.pedido_id).toBe(20);
      expect(result.data.observaciones).toBe('Entrega en domicilio');
    });

    test('debe aceptar campos opcionales como null', () => {
      const result = crearFacturaManualSchema.safeParse({
        ...facturaValida,
        cliente_identificacion: null,
        cliente_direccion: null,
        cliente_telefono: null,
        cliente_email: null,
        pedido_id: null,
        observaciones: null,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('crearDesdePedidoSchema', () => {
    test('debe aceptar un pedidoId válido', () => {
      const result = crearDesdePedidoSchema.safeParse({
        pedidoId: 15,
      });

      expect(result.success).toBe(true);
      expect(result.data.pedidoId).toBe(15);
      expect(result.data.datosAdicionales).toEqual({});
    });

    test('debe aceptar datosAdicionales como objeto', () => {
      const result = crearDesdePedidoSchema.safeParse({
        pedidoId: 15,
        datosAdicionales: {
          observaciones: 'Factura urgente',
          descuento: 5,
        },
      });

      expect(result.success).toBe(true);
      expect(result.data.datosAdicionales).toEqual({
        observaciones: 'Factura urgente',
        descuento: 5,
      });
    });

    test('debe rechazar pedidoId ausente', () => {
      const result = crearDesdePedidoSchema.safeParse({
        datosAdicionales: {},
      });

      expect(result.success).toBe(false);
    });

    test('debe rechazar pedidoId cero', () => {
      const result = crearDesdePedidoSchema.safeParse({
        pedidoId: 0,
      });

      expect(result.success).toBe(false);
    });

    test('debe rechazar pedidoId negativo', () => {
      const result = crearDesdePedidoSchema.safeParse({
        pedidoId: -1,
      });

      expect(result.success).toBe(false);
    });

    test('debe rechazar pedidoId decimal', () => {
      const result = crearDesdePedidoSchema.safeParse({
        pedidoId: 1.5,
      });

      expect(result.success).toBe(false);
    });

    test('debe rechazar pedidoId que no sea número', () => {
      const result = crearDesdePedidoSchema.safeParse({
        pedidoId: '15',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('actualizarFacturaSchema', () => {
    test('debe aceptar actualización parcial válida', () => {
      const result = actualizarFacturaSchema.safeParse({
        cliente_nombre: 'Juan Pérez',
        cliente_email: 'juan@example.com',
        observaciones: 'Actualizar datos',
      });

      expect(result.success).toBe(true);
      expect(result.data.cliente_nombre).toBe('Juan Pérez');
      expect(result.data.cliente_email).toBe('juan@example.com');
    });

    test('debe aceptar objeto vacío porque todos los campos son opcionales', () => {
      const result = actualizarFacturaSchema.safeParse({});

      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    test('debe conservar campos adicionales por passthrough', () => {
      const result = actualizarFacturaSchema.safeParse({
        estado: 'EMITIDA',
        campoFuturo: 'valor',
      });

      expect(result.success).toBe(true);
      expect(result.data.campoFuturo).toBe('valor');
    });

    test('debe aceptar campos nullable como null', () => {
      const result = actualizarFacturaSchema.safeParse({
        cliente_identificacion: null,
        cliente_direccion: null,
        cliente_telefono: null,
        cliente_email: null,
        observaciones: null,
      });

      expect(result.success).toBe(true);
    });

    test('debe rechazar correo inválido', () => {
      const result = actualizarFacturaSchema.safeParse({
        cliente_email: 'correo-invalido',
      });

      expect(result.success).toBe(false);
    });

    test('debe aplicar trim a campos de texto', () => {
      const result = actualizarFacturaSchema.safeParse({
        cliente_nombre: '  Juan Pérez  ',
        estado: '  EMITIDA  ',
        estado_sri: '  AUTORIZADA  ',
      });

      expect(result.success).toBe(true);
      expect(result.data.cliente_nombre).toBe('Juan Pérez');
      expect(result.data.estado).toBe('EMITIDA');
      expect(result.data.estado_sri).toBe('AUTORIZADA');
    });

    test('debe rechazar cliente_nombre mayor a 200 caracteres', () => {
      const result = actualizarFacturaSchema.safeParse({
        cliente_nombre: 'a'.repeat(201),
      });

      expect(result.success).toBe(false);
    });

    test('debe rechazar observaciones mayores a 500 caracteres', () => {
      const result = actualizarFacturaSchema.safeParse({
        observaciones: 'a'.repeat(501),
      });

      expect(result.success).toBe(false);
    });
  });

  describe('anularFacturaSchema', () => {
    test('debe aceptar un motivo válido', () => {
      const result = anularFacturaSchema.safeParse({
        motivo: 'Error en los datos de la factura',
      });

      expect(result.success).toBe(true);
    });

    test('debe aplicar trim al motivo', () => {
      const result = anularFacturaSchema.safeParse({
        motivo: '  Error en la factura  ',
      });

      expect(result.success).toBe(true);
      expect(result.data.motivo).toBe('Error en la factura');
    });

    test('debe rechazar motivo ausente', () => {
      const result = anularFacturaSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    test('debe rechazar motivo menor a 10 caracteres', () => {
      const result = anularFacturaSchema.safeParse({
        motivo: 'Error',
      });

      expect(result.success).toBe(false);
    });

    test('debe aceptar motivo de exactamente 10 caracteres', () => {
      const result = anularFacturaSchema.safeParse({
        motivo: '1234567890',
      });

      expect(result.success).toBe(true);
    });

    test('debe rechazar motivo mayor a 500 caracteres', () => {
      const result = anularFacturaSchema.safeParse({
        motivo: 'a'.repeat(501),
      });

      expect(result.success).toBe(false);
    });

    test('debe rechazar motivo compuesto únicamente por espacios', () => {
      const result = anularFacturaSchema.safeParse({
        motivo: '          ',
      });

      expect(result.success).toBe(false);
    });
  });
});
