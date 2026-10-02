USE inventario_proformas_e2e;

INSERT INTO empresas (
  nombre,
  razon_social,
  ruc,
  direccion,
  telefono,
  email,
  plan,
  activo
) VALUES (
  'Empresa E2E',
  'Empresa E2E S.A.',
  '9999999999001',
  'Dirección E2E',
  '0999999999',
  'e2e@example.com',
  'pro',
  1
);

INSERT INTO usuarios (
  empresa_id,
  nombre,
  nombre_completo,
  email,
  password,
  rol,
  activo
) VALUES (
  LAST_INSERT_ID(),
  'Usuario E2E',
  'Usuario E2E',
  'e2e.admin@example.com',
  '$2a$12$4IvyuY7ku8Xg0a42z.teI.noO.TYglwXo4zLtjKwLYeuO.j9EsRFK',
  'ADMIN',
  1
);
INSERT INTO trabajos (
  empresa_id,
  nombre,
  descripcion,
  tipo,
  activo
) VALUES
  (
    (SELECT id FROM empresas WHERE ruc = '9999999999001'),
    'Ventana E2E',
    'Trabajo de prueba para E2E',
    'VENTANA',
    1
  ),
  (
    (SELECT id FROM empresas WHERE ruc = '9999999999001'),
    'Puerta E2E',
    'Trabajo de prueba para E2E',
    'PUERTA',
    1
  );

INSERT INTO colores (
  empresa_id,
  nombre,
  valor,
  tipo,
  activo
) VALUES
  (
    (SELECT id FROM empresas WHERE ruc = '9999999999001'),
    'Blanco E2E',
    '#FFFFFF',
    'MARCO',
    1
  ),
  (
    (SELECT id FROM empresas WHERE ruc = '9999999999001'),
    'Claro E2E',
    '#D1D5DB',
    'VIDRIO',
    1
  );

INSERT INTO materiales (
  empresa_id,
  nombre,
  descripcion,
  precio,
  stock,
  activo
) VALUES (
  (SELECT id FROM empresas WHERE ruc = '9999999999001'),
  'Material E2E',
  'Material de prueba para cálculo E2E',
  50.00,
  100,
  1
);

INSERT INTO recetas (
  trabajo_id,
  material_id,
  unidad_calculo,
  factor
) VALUES (
  (SELECT id FROM trabajos
   WHERE empresa_id = (SELECT id FROM empresas WHERE ruc = '9999999999001')
     AND nombre = 'Ventana E2E'),
  (SELECT id FROM materiales
   WHERE empresa_id = (SELECT id FROM empresas WHERE ruc = '9999999999001')
     AND nombre = 'Material E2E'),
  'm2',
  1.0000
);
