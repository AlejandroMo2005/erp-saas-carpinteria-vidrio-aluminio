import { describe, it, expect } from 'vitest';

const {
  crearProveedorSchema,
  actualizarProveedorSchema,
  generarSolicitudSchema,
} = require('../../../src/shared/validators/proveedor.validators');

describe('proveedor.validators', () => {
  const proveedorValido = {
    nombre: 'Aluminio Ecuador',
    ciudad: 'Manta',
    telefono_whatsapp: '0999999999',
    email: 'proveedor@example.com',
    notas: 'Proveedor principal',
    material_ids: [1, 2, 3],
  };

  const solicitudValida = {
    proveedor_id: 1,
    items: [
      {
        nombre_material: 'Perfil de aluminio',
        cantidad: 10,
        material_id: 2,
        variante_id: 3,
        color: 'Blanco',
        unidad: 'unidad',
      },
    ],
  };

  describe('crearProveedorSchema', () => {
    it('debe aceptar un proveedor completo', () => {
      const result = crearProveedorSchema.safeParse(proveedorValido);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(proveedorValido);
    });

    it('debe aceptar solo el nombre', () => {
      const result = crearProveedorSchema.safeParse({
        nombre: 'Proveedor local',
      });

      expect(result.success).toBe(true);
      expect(result.data.nombre).toBe('Proveedor local');
      expect(result.data.material_ids).toEqual([]);
    });

    it('debe normalizar espacios del nombre', () => {
      const result = crearProveedorSchema.safeParse({
        nombre: '  Proveedor local  ',
      });

      expect(result.success).toBe(true);
      expect(result.data.nombre).toBe('Proveedor local');
    });

    it('debe aceptar ciudad null', () => {
      const result = crearProveedorSchema.safeParse({
        nombre: 'Proveedor',
        ciudad: null,
      });

      expect(result.success).toBe(true);
      expect(result.data.ciudad).toBeNull();
    });

    it('debe aceptar telefono_whatsapp null', () => {
      const result = crearProveedorSchema.safeParse({
        nombre: 'Proveedor',
        telefono_whatsapp: null,
      });

      expect(result.success).toBe(true);
      expect(result.data.telefono_whatsapp).toBeNull();
    });

    it('debe aceptar email null', () => {
      const result = crearProveedorSchema.safeParse({
        nombre: 'Proveedor',
        email: null,
      });

      expect(result.success).toBe(true);
      expect(result.data.email).toBeNull();
    });

    it('debe aceptar notas null', () => {
      const result = crearProveedorSchema.safeParse({
        nombre: 'Proveedor',
        notas: null,
      });

      expect(result.success).toBe(true);
      expect(result.data.notas).toBeNull();
    });

    it('debe aceptar material_ids vacío', () => {
      const result = crearProveedorSchema.safeParse({
        nombre: 'Proveedor',
        material_ids: [],
      });

      expect(result.success).toBe(true);
      expect(result.data.material_ids).toEqual([]);
    });

    it('debe aceptar material_ids con enteros positivos', () => {
      const result = crearProveedorSchema.safeParse({
        nombre: 'Proveedor',
        material_ids: [1, 5, 100],
      });

      expect(result.success).toBe(true);
    });

    it('debe aplicar material_ids como arreglo vacío cuando se omite', () => {
      const result = crearProveedorSchema.safeParse({
        nombre: 'Proveedor',
      });

      expect(result.success).toBe(true);
      expect(result.data.material_ids).toEqual([]);
    });

    it('debe rechazar nombre ausente', () => {
      const result = crearProveedorSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    it('debe rechazar nombre vacío', () => {
      const result = crearProveedorSchema.safeParse({
        nombre: '',
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar nombre compuesto únicamente por espacios', () => {
      const result = crearProveedorSchema.safeParse({
        nombre: '   ',
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar nombre de exactamente 150 caracteres', () => {
      const result = crearProveedorSchema.safeParse({
        nombre: 'a'.repeat(150),
      });

      expect(result.success).toBe(true);
    });

    it('debe rechazar nombre de más de 150 caracteres', () => {
      const result = crearProveedorSchema.safeParse({
        nombre: 'a'.repeat(151),
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar nombre con tipo no string', () => {
      const result = crearProveedorSchema.safeParse({
        nombre: 123,
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar ciudad de exactamente 100 caracteres', () => {
      const result = crearProveedorSchema.safeParse({
        nombre: 'Proveedor',
        ciudad: 'a'.repeat(100),
      });

      expect(result.success).toBe(true);
    });

    it('debe rechazar ciudad de más de 100 caracteres', () => {
      const result = crearProveedorSchema.safeParse({
        nombre: 'Proveedor',
        ciudad: 'a'.repeat(101),
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar telefono_whatsapp de exactamente 20 caracteres', () => {
      const result = crearProveedorSchema.safeParse({
        nombre: 'Proveedor',
        telefono_whatsapp: '1'.repeat(20),
      });

      expect(result.success).toBe(true);
    });

    it('debe rechazar telefono_whatsapp de más de 20 caracteres', () => {
      const result = crearProveedorSchema.safeParse({
        nombre: 'Proveedor',
        telefono_whatsapp: '1'.repeat(21),
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar email válido', () => {
      const result = crearProveedorSchema.safeParse({
        nombre: 'Proveedor',
        email: 'contacto@proveedor.com',
      });

      expect(result.success).toBe(true);
    });

    it('debe normalizar espacios del email', () => {
      const result = crearProveedorSchema.safeParse({
        nombre: 'Proveedor',
        email: '  contacto@proveedor.com  ',
      });

      expect(result.success).toBe(true);
      expect(result.data.email).toBe('contacto@proveedor.com');
    });

    it('debe rechazar email inválido', () => {
      const result = crearProveedorSchema.safeParse({
        nombre: 'Proveedor',
        email: 'correo-invalido',
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar notas de exactamente 1000 caracteres', () => {
      const result = crearProveedorSchema.safeParse({
        nombre: 'Proveedor',
        notas: 'a'.repeat(1000),
      });

      expect(result.success).toBe(true);
    });

    it('debe rechazar notas de más de 1000 caracteres', () => {
      const result = crearProveedorSchema.safeParse({
        nombre: 'Proveedor',
        notas: 'a'.repeat(1001),
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar material_ids cuando no es un arreglo', () => {
      const result = crearProveedorSchema.safeParse({
        nombre: 'Proveedor',
        material_ids: 1,
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar material_id cero dentro de material_ids', () => {
      const result = crearProveedorSchema.safeParse({
        nombre: 'Proveedor',
        material_ids: [0],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar material_id negativo dentro de material_ids', () => {
      const result = crearProveedorSchema.safeParse({
        nombre: 'Proveedor',
        material_ids: [-1],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar material_id decimal dentro de material_ids', () => {
      const result = crearProveedorSchema.safeParse({
        nombre: 'Proveedor',
        material_ids: [1.5],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar material_id string dentro de material_ids', () => {
      const result = crearProveedorSchema.safeParse({
        nombre: 'Proveedor',
        material_ids: ['1'],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar material_ids null', () => {
      const result = crearProveedorSchema.safeParse({
        nombre: 'Proveedor',
        material_ids: null,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('actualizarProveedorSchema', () => {
    it('debe aceptar un proveedor completo', () => {
      const result = actualizarProveedorSchema.safeParse(proveedorValido);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(proveedorValido);
    });

    it('debe aceptar actualización con solo nombre', () => {
      const result = actualizarProveedorSchema.safeParse({
        nombre: 'Proveedor actualizado',
      });

      expect(result.success).toBe(true);
      expect(result.data.nombre).toBe('Proveedor actualizado');
      expect(result.data.material_ids).toEqual([]);
    });

    it('debe aplicar el default de material_ids en actualización', () => {
      const result = actualizarProveedorSchema.safeParse({
        nombre: 'Proveedor actualizado',
        ciudad: 'Flavio Alfaro',
      });

      expect(result.success).toBe(true);
      expect(result.data.material_ids).toEqual([]);
    });

    it('debe rechazar nombre ausente', () => {
      const result = actualizarProveedorSchema.safeParse({
        ciudad: 'Manta',
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar nombre vacío', () => {
      const result = actualizarProveedorSchema.safeParse({
        nombre: '',
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar campos opcionales como null', () => {
      const result = actualizarProveedorSchema.safeParse({
        nombre: 'Proveedor',
        ciudad: null,
        telefono_whatsapp: null,
        email: null,
        notas: null,
      });

      expect(result.success).toBe(true);
    });

    it('debe rechazar email inválido', () => {
      const result = actualizarProveedorSchema.safeParse({
        nombre: 'Proveedor',
        email: 'email-invalido',
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar material_ids con valores no positivos', () => {
      const result = actualizarProveedorSchema.safeParse({
        nombre: 'Proveedor',
        material_ids: [1, 0, 2],
      });

      expect(result.success).toBe(false);
    });
  });

  describe('itemSolicitudSchema mediante generarSolicitudSchema', () => {
    it('debe aceptar un item completo', () => {
      const result = generarSolicitudSchema.safeParse(solicitudValida);

      expect(result.success).toBe(true);
      expect(result.data.items[0]).toEqual(solicitudValida.items[0]);
    });

    it('debe aceptar un item con campos opcionales omitidos', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 1,
        items: [
          {
            nombre_material: 'Perfil',
            cantidad: 2,
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.items[0].unidad).toBe('unidad');
    });

    it('debe aceptar material_id null', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 1,
        items: [{
          nombre_material: 'Perfil',
          cantidad: 2,
          material_id: null,
        }],
      });

      expect(result.success).toBe(true);
    });

    it('debe aceptar variante_id null', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 1,
        items: [{
          nombre_material: 'Perfil',
          cantidad: 2,
          variante_id: null,
        }],
      });

      expect(result.success).toBe(true);
    });

    it('debe aceptar color null', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 1,
        items: [{
          nombre_material: 'Perfil',
          cantidad: 2,
          color: null,
        }],
      });

      expect(result.success).toBe(true);
    });

    it('debe aceptar unidad personalizada', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 1,
        items: [{
          nombre_material: 'Vidrio',
          cantidad: 5,
          unidad: 'metro',
        }],
      });

      expect(result.success).toBe(true);
      expect(result.data.items[0].unidad).toBe('metro');
    });

    it('debe normalizar espacios en nombre_material', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 1,
        items: [{
          nombre_material: '  Vidrio templado  ',
          cantidad: 2,
        }],
      });

      expect(result.success).toBe(true);
      expect(result.data.items[0].nombre_material).toBe('Vidrio templado');
    });

    it('debe normalizar espacios en color', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 1,
        items: [{
          nombre_material: 'Vidrio',
          cantidad: 2,
          color: '  Negro  ',
        }],
      });

      expect(result.success).toBe(true);
      expect(result.data.items[0].color).toBe('Negro');
    });

    it('debe aceptar nombre_material de exactamente 200 caracteres', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 1,
        items: [{
          nombre_material: 'a'.repeat(200),
          cantidad: 1,
        }],
      });

      expect(result.success).toBe(true);
    });

    it('debe rechazar nombre_material de más de 200 caracteres', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 1,
        items: [{
          nombre_material: 'a'.repeat(201),
          cantidad: 1,
        }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar nombre_material vacío', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 1,
        items: [{
          nombre_material: '',
          cantidad: 1,
        }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar nombre_material compuesto únicamente por espacios', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 1,
        items: [{
          nombre_material: '   ',
          cantidad: 1,
        }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar cantidad ausente', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 1,
        items: [{
          nombre_material: 'Perfil',
        }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar cantidad cero', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 1,
        items: [{
          nombre_material: 'Perfil',
          cantidad: 0,
        }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar cantidad negativa', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 1,
        items: [{
          nombre_material: 'Perfil',
          cantidad: -1,
        }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar cantidad con tipo string', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 1,
        items: [{
          nombre_material: 'Perfil',
          cantidad: '2',
        }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar material_id cero', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 1,
        items: [{
          nombre_material: 'Perfil',
          cantidad: 1,
          material_id: 0,
        }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar material_id negativo', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 1,
        items: [{
          nombre_material: 'Perfil',
          cantidad: 1,
          material_id: -1,
        }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar variante_id cero', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 1,
        items: [{
          nombre_material: 'Perfil',
          cantidad: 1,
          variante_id: 0,
        }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar variante_id negativo', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 1,
        items: [{
          nombre_material: 'Perfil',
          cantidad: 1,
          variante_id: -1,
        }],
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar color de exactamente 100 caracteres', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 1,
        items: [{
          nombre_material: 'Perfil',
          cantidad: 1,
          color: 'a'.repeat(100),
        }],
      });

      expect(result.success).toBe(true);
    });

    it('debe rechazar color de más de 100 caracteres', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 1,
        items: [{
          nombre_material: 'Perfil',
          cantidad: 1,
          color: 'a'.repeat(101),
        }],
      });

      expect(result.success).toBe(false);
    });

    it('debe aceptar unidad de exactamente 30 caracteres', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 1,
        items: [{
          nombre_material: 'Perfil',
          cantidad: 1,
          unidad: 'a'.repeat(30),
        }],
      });

      expect(result.success).toBe(true);
    });

    it('debe rechazar unidad de más de 30 caracteres', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 1,
        items: [{
          nombre_material: 'Perfil',
          cantidad: 1,
          unidad: 'a'.repeat(31),
        }],
      });

      expect(result.success).toBe(false);
    });
  });

  describe('generarSolicitudSchema', () => {
    it('debe aceptar múltiples items', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 5,
        items: [
          {
            nombre_material: 'Perfil de aluminio',
            cantidad: 10,
          },
          {
            nombre_material: 'Vidrio templado',
            cantidad: 4,
            unidad: 'm2',
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(2);
    });

    it('debe rechazar proveedor_id ausente', () => {
      const result = generarSolicitudSchema.safeParse({
        items: [{
          nombre_material: 'Perfil',
          cantidad: 1,
        }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar proveedor_id cero', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 0,
        items: [{
          nombre_material: 'Perfil',
          cantidad: 1,
        }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar proveedor_id negativo', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: -1,
        items: [{
          nombre_material: 'Perfil',
          cantidad: 1,
        }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar proveedor_id decimal', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 1.5,
        items: [{
          nombre_material: 'Perfil',
          cantidad: 1,
        }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar proveedor_id como string', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: '1',
        items: [{
          nombre_material: 'Perfil',
          cantidad: 1,
        }],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar items ausentes', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 1,
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar items vacío', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 1,
        items: [],
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar items que no sean un arreglo', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 1,
        items: {},
      });

      expect(result.success).toBe(false);
    });

    it('debe rechazar item con nombre_material ausente', () => {
      const result = generarSolicitudSchema.safeParse({
        proveedor_id: 1,
        items: [{
          cantidad: 1,
        }],
      });

      expect(result.success).toBe(false);
    });
  });
});
