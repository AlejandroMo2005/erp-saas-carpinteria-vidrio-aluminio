# Estrategia E2E

## 1. Propósito

Este documento establece la estrategia de pruebas End-to-End (E2E) para verificar los flujos funcionales completos de la plataforma ERP/SaaS.

Las pruebas E2E validan el comportamiento observable del sistema desde la interacción del usuario con el frontend hasta la respuesta del backend y la persistencia de los datos cuando el flujo lo requiere.

---

## 2. Alcance

La estrategia contempla:

- Aplicación React/Vite.
- API Node/Express.
- Autenticación.
- Autorización.
- Multi-tenancy.
- MySQL.
- Redis.
- Clientes.
- Materiales.
- Inventario.
- Proformas.
- Pedidos.
- Facturación.
- Proveedores.
- Trabajos.
- IA.
- Sesiones.
- Navegación.
- Manejo de errores.

---

## 3. Objetivos

Las pruebas E2E deben comprobar que:

1. El usuario pueda completar los flujos principales.
2. La interfaz se comunique correctamente con la API.
3. La autenticación se mantenga durante el flujo.
4. Los permisos se respeten.
5. El aislamiento entre empresas se mantenga.
6. Los datos se persistan correctamente.
7. Los cambios de estado sean coherentes.
8. Los errores se presenten de manera controlada.
9. Los flujos críticos funcionen después de cambios de código.
10. Las regresiones funcionales puedan detectarse automáticamente.

---

## 4. Herramienta

El proyecto dispone de configuración de Playwright para pruebas E2E.

La configuración contempla:

- Chromium.
- `baseURL` del frontend.
- Arranque del servidor mediante `npm run dev`.
- Reintentos en CI.
- Reporte HTML.
- Reporte JSON.
- Reporte JUnit.

Las pruebas deben utilizar la configuración existente y evitar duplicar mecanismos de ejecución innecesariamente.

---

## 5. Arquitectura de prueba

El flujo general es:

```text
Playwright
    ↓
Frontend
    ↓
API
    ↓
Servicios
    ↓
MySQL / Redis
    ↓
Resultado
```

Cuando una funcionalidad depende de servicios externos, estos deben aislarse o controlarse cuando el objetivo sea probar el comportamiento propio de la plataforma.

---

## 6. Principio de cobertura por flujos

Las pruebas E2E no deben intentar cubrir todas las funciones internas.

Su objetivo principal es cubrir los recorridos críticos del usuario.

La cobertura debe priorizar:

- Autenticación.
- Navegación protegida.
- Clientes.
- Materiales.
- Inventario.
- Proformas.
- Pedidos.
- Facturación.
- Operaciones críticas de sesión.
- Flujos con impacto empresarial.

---

## 7. Datos de prueba

Los datos E2E deben ser independientes de producción.

Deben contemplar:

- Usuario de prueba.
- Empresa de prueba.
- Clientes de prueba.
- Materiales de prueba.
- Proformas de prueba.
- Pedidos de prueba.
- Datos de facturación cuando corresponda.

Los datos deben poder prepararse y limpiarse de forma reproducible.

---

## 8. Usuario de prueba

El usuario utilizado por E2E debe disponer únicamente de los permisos necesarios para el flujo que se está probando.

Cuando se prueben diferentes roles, cada escenario debe utilizar el usuario correspondiente.

No debe utilizarse una cuenta productiva.

---

## 9. Autenticación

El flujo mínimo debe verificar:

```text
Abrir aplicación
    ↓
Formulario de login
    ↓
Credenciales
    ↓
Autenticación
    ↓
Acceso al área protegida
```

Debe comprobarse:

- Login exitoso.
- Credenciales incorrectas.
- Usuario inactivo.
- Redirección después del login.
- Persistencia de sesión.
- Logout.
- Acceso posterior a logout.

---

## 10. Protección de rutas

Debe verificarse que una ruta protegida no sea accesible sin autenticación.

Escenario:

```text
Usuario no autenticado
        ↓
Ruta protegida
        ↓
Acceso rechazado / redirección
```

También debe verificarse que un usuario autenticado pueda acceder únicamente a las rutas permitidas por su rol.

---

## 11. Sesión

Las pruebas deben comprobar:

- Inicio de sesión.
- Solicitudes autenticadas.
- Expiración.
- Logout.
- Invalidación.
- Acceso después de revocación cuando corresponda.

El comportamiento debe ser consistente entre frontend y backend.

---

## 12. Roles

Los escenarios E2E deben incluir, cuando corresponda:

- `ADMIN`.
- `VENDEDOR`.
- `ALMACEN`.
- `CLIENTE`.

No es necesario ejecutar todos los flujos con todos los roles si la matriz de autorización ya permite identificar combinaciones redundantes.

Los casos deben priorizar operaciones con diferentes niveles de privilegio.

---

## 13. Multi-tenancy

Debe existir al menos un flujo E2E que compruebe el aislamiento entre empresas.

Ejemplo:

```text
Login Empresa A
       ↓
Consultar recurso A
       ↓
Correcto

Intentar recurso B
       ↓
Rechazado
```

La prueba debe comprobar el resultado observable y, cuando sea necesario, verificar la persistencia para asegurar que no se produjo una modificación indebida.

---

## 14. Clientes

El flujo E2E debe cubrir, según el alcance del sistema:

```text
Login
  ↓
Clientes
  ↓
Nuevo cliente
  ↓
Completar formulario
  ↓
Guardar
  ↓
Verificar cliente
```

También deben probarse validaciones relevantes y errores de persistencia cuando puedan reproducirse de forma controlada.

---

## 15. Materiales

El flujo principal debe verificar:

```text
Login
  ↓
Materiales
  ↓
Crear / modificar material
  ↓
Guardar
  ↓
Consultar
  ↓
Verificar datos
```

Debe contemplarse la información relevante del material, como:

- Nombre.
- Precio.
- Stock.
- Stock mínimo.
- Estado.
- Variantes cuando correspondan.

---

## 16. Inventario

Los flujos E2E de inventario deben comprobar operaciones observables relacionadas con:

- Disponibilidad.
- Stock.
- Materiales.
- Variantes.
- Actualizaciones.
- Validaciones.

Cuando una operación modifique inventario, debe verificarse el resultado final desde la interfaz y, cuando sea necesario, mediante una comprobación de persistencia.

---

## 17. Proformas

La creación de una proforma constituye un flujo crítico.

Debe contemplar:

```text
Login
  ↓
Proformas
  ↓
Nueva proforma
  ↓
Cliente
  ↓
Materiales / trabajo
  ↓
Medidas
  ↓
Cantidades
  ↓
Precios
  ↓
Total
  ↓
Guardar
  ↓
Consultar proforma
```

Debe comprobarse que la información mostrada después de guardar corresponda con la operación realizada.

---

## 18. Pedidos

Cuando una proforma pueda originar un pedido, el flujo debe comprobar:

```text
Proforma
   ↓
Crear pedido
   ↓
Pedido persistido
   ↓
Detalle
   ↓
Total
   ↓
Estado
```

Debe verificarse que los registros relacionados mantengan sus asociaciones correctas.

---

## 19. Facturación

El flujo E2E de facturación debe comprobar las operaciones disponibles para el usuario autorizado.

Debe contemplar cuando corresponda:

- Selección de información.
- Detalles.
- Cantidades.
- Precios.
- IVA.
- Total.
- Estado.
- Secuencia.
- Resultado de la operación.

Las integraciones reales con SRI deben separarse de las pruebas que únicamente necesitan comprobar el comportamiento interno de la aplicación.

---

## 20. Proveedores

Los escenarios E2E deben cubrir las operaciones relevantes del módulo:

```text
Proveedores
  ↓
Crear
  ↓
Consultar
  ↓
Modificar
  ↓
Verificar
```

También debe comprobarse la asociación con materiales cuando corresponda.

---

## 21. Trabajos y referencias

Los flujos de trabajos deben comprobar:

- Creación.
- Consulta.
- Modificación.
- Estado.
- Relación con recetas.
- Referencias cuando corresponda.

Las pruebas deben evitar depender de archivos o servicios externos inestables cuando estos no sean el objetivo principal del caso.

---

## 22. Inteligencia artificial

Los flujos E2E relacionados con IA deben considerar la naturaleza externa del servicio.

Cuando sea posible, debe probarse:

```text
Usuario
  ↓
Carga / entrada
  ↓
Solicitud al backend
  ↓
Procesamiento
  ↓
Resultado
```

También deben existir escenarios para:

- Entrada inválida.
- Archivo inválido.
- Timeout.
- Error del proveedor.
- Cuota agotada.
- Resultado no disponible.

No debe asumirse que el proveedor externo estará disponible durante todas las ejecuciones de CI.

---

## 23. Formularios

Los formularios E2E deben verificar:

- Campos obligatorios.
- Tipos.
- Rangos.
- Mensajes de validación.
- Envío.
- Estados de carga.
- Éxito.
- Error.

No es necesario repetir exhaustivamente las pruebas unitarias de cada validador.

El objetivo E2E es comprobar que la validación esté correctamente integrada en el flujo del usuario.

---

## 24. Navegación

Debe verificarse la navegación entre módulos críticos.

Los casos deben comprobar:

- Menú.
- Rutas.
- Botones.
- Redirecciones.
- Volver.
- Enlaces.
- Rutas protegidas.
- Estados después de navegación.

Las pruebas no deben depender de selectores frágiles basados únicamente en clases CSS generadas.

---

## 25. Selectores

Los selectores deben priorizar:

1. Roles accesibles.
2. Texto estable.
3. Labels.
4. Atributos destinados a pruebas.
5. Selectores estructurales únicamente cuando sean necesarios.

Cuando un componente requiera identificación estable, puede utilizarse un atributo específico para pruebas.

Debe evitarse depender de:

- Índices de elementos.
- Clases dinámicas.
- Estructuras DOM innecesariamente profundas.

---

## 26. Estados de carga

Los flujos E2E deben contemplar operaciones asíncronas.

La prueba debe esperar condiciones funcionales, por ejemplo:

```text
Solicitud
  ↓
Loading
  ↓
Contenido disponible
```

No debe depender únicamente de `sleep` o esperas temporales arbitrarias.

---

## 27. Manejo de errores

Debe existir cobertura para errores visibles al usuario:

- 400.
- 401.
- 403.
- 404.
- 409.
- 422.
- 429.
- 500.

La prueba debe verificar que la aplicación:

- No quede bloqueada.
- Muestre un estado entendible.
- Mantenga la sesión cuando corresponda.
- Permita continuar cuando sea seguro.

---

## 28. CSRF y credenciales

Las pruebas E2E deben ejecutarse en condiciones equivalentes al flujo real del navegador.

Debe verificarse que las solicitudes autenticadas puedan utilizar:

- Cookies.
- Credenciales.
- Token CSRF.
- Headers requeridos.

Los escenarios deben comprobar también el comportamiento cuando el token requerido sea inválido o esté ausente, cuando esto pueda probarse desde el entorno E2E.

---

## 29. Acceso cruzado

Los casos multi-tenant deben intentar acceder a recursos de otra empresa mediante:

- Navegación.
- URL directa.
- Identificador manipulado.
- Solicitud desde la interfaz cuando sea posible.

El resultado esperado debe ser rechazo o ausencia del recurso, según el contrato del endpoint.

---

## 30. Persistencia

Cuando un flujo E2E modifica datos, debe verificarse que:

```text
Interfaz
  ↓
API
  ↓
Persistencia
  ↓
Nueva consulta
  ↓
Dato disponible
```

Esto permite detectar errores donde la interfaz muestra temporalmente un estado que no fue persistido correctamente.

---

## 31. Limpieza

Los datos generados por E2E deben limpiarse después de las pruebas cuando sea necesario.

Debe evitarse que una ejecución afecte la siguiente.

Cuando el flujo necesite conservar datos entre casos, esa dependencia debe declararse explícitamente y limitarse a un conjunto controlado de pruebas.

---

## 32. Aislamiento entre pruebas

Las pruebas deben ser independientes siempre que sea razonable.

Una prueba no debe depender de:

- El orden de ejecución.
- Datos creados por otra prueba.
- Estado residual del navegador.
- Sesiones anteriores.
- Caché no controlada.

Cuando exista una dependencia deliberada, debe formar parte de una secuencia E2E explícita.

---

## 33. Navegador

El proyecto utiliza Chromium como navegador E2E configurado.

La ejecución inicial puede concentrarse en este navegador para mantener un conjunto de pruebas estable.

La incorporación de otros navegadores debe justificarse por requisitos de compatibilidad.

---

## 34. Ejecución local

Las pruebas E2E deben poder ejecutarse mediante la configuración del proyecto.

El servidor frontend se inicia mediante:

```bash
npm run dev
```

y Playwright utiliza la `baseURL` configurada para interactuar con la aplicación.

La disponibilidad de la API y de las dependencias requeridas debe verificarse antes de ejecutar los flujos que dependan de ellas.

---

## 35. Ejecución en CI

En CI deben considerarse:

- Instalación reproducible.
- Navegador requerido.
- Variables de entorno.
- Backend.
- Frontend.
- MySQL.
- Redis.
- Datos de prueba.
- Tiempo máximo de ejecución.
- Reintentos.
- Artefactos.

Los reintentos pueden utilizarse para reducir fallos transitorios, pero no deben ocultar pruebas inestables.

---

## 36. Reportes

La configuración actual contempla:

- Reporte HTML.
- Reporte JSON.
- Reporte JUnit.

Los reportes deben conservarse como evidencia cuando la ejecución ocurra dentro de CI y la configuración del pipeline lo permita.

---

## 37. Evidencia visual

Los screenshots deben utilizarse cuando aporten información para investigar un fallo.

No es necesario generar screenshots para cada prueba exitosa.

En casos de fallo pueden conservarse:

- Screenshot.
- Trace.
- Video cuando esté habilitado.
- Logs.
- Reporte de Playwright.

---

## 38. Trazas

Las trazas de Playwright son especialmente útiles para investigar:

- Fallos intermitentes.
- Problemas de navegación.
- Esperas.
- Requests.
- Cambios de estado.
- Errores de interfaz.

Su almacenamiento debe limitarse a ejecuciones donde aporten valor o a fallos de CI.

---

## 39. Pruebas críticas

Los siguientes flujos deben considerarse candidatos prioritarios:

1. Login.
2. Logout.
3. Acceso protegido.
4. Aislamiento multi-tenant.
5. Creación de cliente.
6. Gestión de material.
7. Flujo de inventario.
8. Creación de proforma.
9. Conversión a pedido.
10. Facturación.
11. Operaciones administrativas sensibles.

La selección definitiva debe mantenerse alineada con el alcance funcional real.

---

## 40. Regresión

Las pruebas E2E deben funcionar como una barrera de regresión para los flujos críticos.

Después de cambios en:

- Rutas.
- API.
- Autenticación.
- Autorización.
- Componentes.
- Formularios.
- Persistencia.
- Facturación.
- Inventario.

debe ejecutarse el conjunto E2E afectado.

---

## 41. Flakiness

Una prueba inestable debe investigarse y no simplemente ocultarse mediante reintentos.

Las causas pueden incluir:

- Esperas incorrectas.
- Datos compartidos.
- Dependencias externas.
- Condiciones de carrera.
- Selectores frágiles.
- Estado residual.
- Servicios no disponibles.

El reintento en CI debe considerarse un mecanismo de tolerancia, no una solución al problema.

---

## 42. Rendimiento E2E

Las pruebas E2E no sustituyen las pruebas de carga.

Pueden utilizarse para observar:

- Tiempo de navegación.
- Tiempo de respuesta observable.
- Bloqueos.
- Estados de carga.

Pero las mediciones formales de carga, concurrencia y capacidad deben mantenerse en una estrategia específica de rendimiento.

---

## 43. Seguridad E2E

Los escenarios E2E deben complementar las pruebas de seguridad.

Deben verificarse, cuando corresponda:

- Acceso sin autenticación.
- Acceso con rol incorrecto.
- Acceso cruzado entre empresas.
- Logout.
- Sesión expirada.
- Operaciones administrativas.
- Manipulación de identificadores.

Las pruebas E2E no sustituyen DAST ni análisis estático.

---

## 44. Integración con pruebas unitarias

Cada nivel tiene una finalidad diferente:

```text
Unitarias
  ↓
Lógica aislada

Integración
  ↓
Interacción entre componentes

E2E
  ↓
Flujo funcional completo
```

No debe trasladarse toda la cobertura unitaria hacia E2E debido al mayor costo y sensibilidad de estas pruebas.

---

## 45. Criterios de aprobación

Un flujo E2E se considera aprobado cuando:

- El usuario puede completar la operación.
- La navegación es correcta.
- Las validaciones funcionan.
- La API responde según el contrato.
- La autorización se respeta.
- El tenant es correcto.
- Los datos se persisten cuando corresponde.
- El estado final es verificable.
- No aparecen errores inesperados.
- La prueba es reproducible.

---

## 46. Estado actual

El proyecto dispone de configuración Playwright para E2E con Chromium, `baseURL`, servidor frontend, reintentos en CI y reportes HTML, JSON y JUnit.

La cobertura E2E debe ampliarse progresivamente sobre los flujos críticos, especialmente autenticación, multi-tenancy, inventario, proformas, pedidos y facturación.

La ejecución de flujos que requieran MySQL, Redis o servicios externos depende de que el entorno correspondiente esté disponible y configurado.

---

## 47. Criterios de aceptación

La estrategia E2E se considera cubierta cuando:

- Los flujos críticos están automatizados.
- Login y logout están cubiertos.
- Las rutas protegidas están cubiertas.
- El aislamiento multi-tenant está probado.
- Los roles críticos tienen escenarios de autorización.
- Los flujos de clientes están cubiertos.
- Inventario tiene cobertura E2E.
- Proformas tienen cobertura E2E.
- Pedidos tienen cobertura E2E.
- Facturación tiene cobertura E2E.
- Los errores críticos tienen cobertura.
- Los datos de prueba son reproducibles.
- CI puede ejecutar los escenarios con infraestructura disponible.
- Los fallos generan evidencia suficiente para investigación.

---

## 48. Mantenimiento

La estrategia debe actualizarse cuando:

- Se agreguen flujos críticos.
- Se modifiquen rutas.
- Se modifique autenticación.
- Se cambie autorización.
- Se agreguen roles.
- Se modifique multi-tenancy.
- Se cambie la API.
- Se modifique la base de datos.
- Se incorporen módulos.
- Se modifique Playwright.
- Se cambie la infraestructura de CI/CD.

Cada nueva funcionalidad crítica debe determinar si requiere un nuevo escenario E2E o una modificación de los escenarios existentes.
