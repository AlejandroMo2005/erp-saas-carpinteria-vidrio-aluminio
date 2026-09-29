# Estrategia de Pruebas

## Descripción

Este documento define la estrategia de pruebas para la plataforma web empresarial full-stack tipo ERP/SaaS orientada a negocios de carpintería de vidrio y aluminio.

La estrategia establece los niveles de prueba, objetivos, alcance, criterios de selección, responsabilidades, evidencia y condiciones de aceptación necesarias para reducir el riesgo de regresiones y verificar el comportamiento del sistema.

## Objetivo

Establecer un enfoque sistemático para verificar:

- comportamiento funcional;
- reglas de negocio;
- contratos entre frontend y backend;
- persistencia;
- autenticación y autorización;
- aislamiento multi-tenant;
- integraciones;
- flujos completos;
- seguridad;
- rendimiento;
- estabilidad durante cambios arquitectónicos.

La estrategia prioriza la reducción de riesgo sobre el incremento artificial de métricas de cobertura.

## Alcance

La estrategia contempla:

- frontend;
- backend;
- API;
- base de datos;
- Redis;
- autenticación;
- autorización;
- multi-tenancy;
- inventario;
- clientes;
- proveedores;
- trabajos;
- proformas;
- pedidos;
- facturación;
- IA;
- integraciones externas;
- observabilidad;
- CI/CD;
- despliegue.

## Principios

Las pruebas deben seguir estos principios:

1. probar comportamiento observable;
2. priorizar funcionalidades críticas;
3. aislar dependencias cuando la prueba lo requiera;
4. utilizar datos controlados;
5. evitar dependencia innecesaria de servicios externos;
6. reproducir errores antes de corregirlos cuando sea posible;
7. verificar regresiones después de cambios estructurales;
8. mantener pruebas deterministas;
9. no utilizar cobertura como único indicador de calidad;
10. ejecutar pruebas adecuadas al nivel de riesgo del cambio.

## Pirámide de pruebas

La estrategia utiliza diferentes niveles:

```text
                 E2E
              ─────────
           Integración
        ─────────────────
              Unitarias
     ─────────────────────────
```

Las pruebas unitarias deben constituir la base de la estrategia.

Las pruebas de integración deben verificar la interacción entre componentes relevantes.

Las pruebas E2E deben concentrarse en los flujos críticos y no sustituir las pruebas de niveles inferiores.

## Pruebas unitarias

Las pruebas unitarias verifican unidades pequeñas de comportamiento de forma aislada.

Deben utilizarse especialmente para:

- funciones;
- utilidades;
- validadores;
- cálculos;
- transformaciones;
- hooks;
- componentes con lógica;
- servicios aislables;
- reglas de negocio.

### Backend

El backend dispone de una suite amplia de pruebas automatizadas ejecutada mediante Vitest.

Las pruebas deben cubrir especialmente:

- controladores;
- servicios;
- repositorios;
- validadores;
- middleware;
- autenticación;
- autorización;
- utilidades;
- reglas de negocio.

### Frontend

El frontend utiliza Vitest para pruebas unitarias y de componentes.

Las pruebas deben concentrarse en:

- componentes con comportamiento;
- hooks;
- utilidades;
- formularios;
- validaciones;
- transformaciones de datos;
- estados de carga;
- estados de error;
- interacciones relevantes.

## Pruebas de integración

Las pruebas de integración verifican la interacción entre dos o más componentes.

Deben utilizarse cuando el comportamiento no puede verificarse adecuadamente mediante una prueba unitaria aislada.

Ejemplos:

- controlador → servicio;
- servicio → repositorio;
- repositorio → MySQL;
- autenticación → sesión;
- API → persistencia;
- API → Redis;
- frontend → API;
- procesos de facturación → persistencia.

Las pruebas de integración deben utilizar datos controlados y ambientes de prueba separados de los datos reales.

## Base de datos

Las pruebas relacionadas con MySQL deben verificar, según corresponda:

- inserciones;
- actualizaciones;
- consultas;
- relaciones;
- claves foráneas;
- restricciones;
- índices;
- soft delete;
- transacciones;
- triggers;
- comportamiento ante errores.

No debe utilizarse información real de clientes o empresas para pruebas.

## Redis

Las pruebas relacionadas con Redis deben verificar los comportamientos que dependan de almacenamiento temporal, sesiones o blacklist.

Cuando sea posible, las pruebas deben utilizar una instancia de Redis exclusiva para pruebas.

## API

Las pruebas de API deben verificar:

- método HTTP;
- ruta;
- autenticación;
- autorización;
- validación;
- parámetros;
- cuerpo de solicitud;
- respuesta;
- códigos HTTP;
- errores;
- aislamiento de empresa;
- comportamiento ante datos inválidos.

Los contratos documentados en `docs/API/api-contracts.md` deben mantenerse coherentes con las pruebas.

## Autenticación

Las pruebas de autenticación deben cubrir:

- inicio de sesión exitoso;
- credenciales inválidas;
- usuario inactivo;
- expiración de sesión;
- renovación;
- logout;
- revocación;
- recuperación de contraseña;
- acceso sin autenticación;
- tokens inválidos;
- tokens revocados.

Las pruebas deben evitar almacenar credenciales reales.

## Autorización

Las pruebas deben verificar que cada rol pueda realizar únicamente las operaciones permitidas por el backend.

Debe comprobarse tanto:

- acceso permitido;
- acceso denegado.

Ocultar una opción en el frontend no constituye una prueba suficiente de autorización.

## Multi-tenancy

El aislamiento entre empresas constituye un aspecto crítico.

Las pruebas deben verificar que:

- una empresa pueda acceder a sus propios datos;
- una empresa no pueda consultar datos de otra empresa;
- una empresa no pueda modificar datos de otra empresa;
- las operaciones de creación utilicen el contexto correcto;
- los identificadores de registros no permitan saltarse el aislamiento;
- los repositorios y servicios mantengan el contexto de empresa.

Debe incluirse al menos un caso explícito de intento de acceso cruzado entre empresas.

## Inventario

Las pruebas del inventario deben verificar:

- creación;
- modificación;
- consulta;
- stock;
- precios;
- variantes;
- colores;
- stock mínimo;
- eliminación lógica cuando corresponda;
- validaciones;
- relaciones entre materiales y proveedores.

Los cálculos deben probarse con valores normales y casos límite.

## Proformas

Las pruebas de proformas deben verificar:

- creación;
- actualización;
- consulta;
- detalle;
- cálculos;
- cantidades;
- precios;
- dimensiones;
- cliente;
- materiales;
- eliminación lógica cuando corresponda.

Los cálculos relacionados con medidas deben incluir valores dentro y fuera de los límites definidos por el sistema.

## Pedidos

Las pruebas deben verificar:

- creación;
- detalle;
- total;
- estado;
- relación con proformas;
- usuario;
- empresa;
- eliminación lógica;
- transiciones de estado permitidas.

Los cambios de estado inválidos deben generar respuestas controladas.

## Facturación

Las pruebas deben verificar:

- creación;
- detalle;
- cálculo de totales;
- IVA;
- estados;
- numeración;
- relaciones;
- validaciones;
- comportamiento ante errores;
- operaciones asociadas con el ciclo de facturación.

Los cambios de estado deben probarse según las reglas del dominio.

## IA

Las pruebas de IA deben separar la lógica interna del comportamiento real de los proveedores externos cuando sea posible.

Deben verificarse:

- validación de imágenes;
- validación de parámetros;
- construcción de solicitudes;
- manejo de respuestas;
- errores;
- timeouts;
- reintentos;
- persistencia;
- trazabilidad;
- comportamiento ante proveedor no disponible.

Las pruebas unitarias no deben depender innecesariamente de consumir créditos de proveedores externos.

## Integraciones externas

Las integraciones externas deben probarse mediante:

- mocks;
- stubs;
- respuestas controladas;
- pruebas de integración específicas;
- pruebas reales limitadas cuando sean necesarias.

Debe verificarse el comportamiento ante:

- respuesta válida;
- error HTTP;
- timeout;
- respuesta inválida;
- indisponibilidad;
- límite del proveedor.

## Pruebas E2E

Las pruebas end-to-end utilizan Playwright.

Deben representar flujos completos desde la perspectiva del usuario.

Los flujos E2E deben concentrarse en operaciones críticas, por ejemplo:

1. autenticación;
2. navegación principal;
3. gestión de clientes;
4. gestión de materiales;
5. creación de proformas;
6. generación o gestión de pedidos;
7. procesos de facturación;
8. funcionalidades críticas de IA cuando sean verificables;
9. logout.

La cantidad de pruebas E2E debe mantenerse controlada para evitar tiempos excesivos y fragilidad innecesaria.

## Datos de prueba

Los datos utilizados deben ser:

- sintéticos;
- reproducibles;
- mínimos;
- independientes de datos reales;
- adecuados para el caso probado.

Los datos de prueba deben incluir también casos límite.

Ejemplos:

- valores mínimos;
- valores máximos;
- valores cero cuando sean válidos;
- cadenas vacías;
- campos ausentes;
- caracteres especiales;
- cantidades inválidas;
- identificadores inexistentes.

## Aislamiento de pruebas

Las pruebas deben ejecutarse en ambientes separados de producción.

Cuando sea necesario utilizar servicios reales, se deben utilizar cuentas, bases de datos y credenciales destinadas exclusivamente a pruebas.

No se deben reutilizar credenciales productivas.

## Pruebas deterministas

Una prueba debe producir el mismo resultado ante las mismas condiciones.

Debe evitarse depender de:

- hora actual sin control;
- datos externos cambiantes;
- servicios externos sin mock;
- generación aleatoria no controlada;
- orden incidental de ejecución;
- estado persistente dejado por otra prueba.

Cuando el comportamiento dependa del tiempo, este debe controlarse mediante mecanismos de prueba apropiados.

## Cobertura

La cobertura debe utilizarse como indicador complementario.

Las métricas relevantes incluyen:

- statements;
- branches;
- functions;
- lines.

Sin embargo, una cobertura elevada no garantiza que los escenarios críticos estén correctamente probados.

La prioridad debe ser cubrir comportamiento de alto riesgo y reglas de negocio importantes.

## Umbrales

Los umbrales configurados en las herramientas de testing deben funcionar como barrera mínima de calidad.

No deben considerarse el objetivo final de la estrategia.

Una modificación que incremente cobertura pero no cubra un flujo crítico no debe considerarse necesariamente una mejora suficiente.

## Regresión

Después de modificar:

- arquitectura;
- autenticación;
- autorización;
- multi-tenancy;
- persistencia;
- cálculos;
- facturación;
- API;
- componentes compartidos;

deben ejecutarse las pruebas relacionadas y posteriormente la suite apropiada para detectar regresiones.

Las migraciones de código legacy deben incluir pruebas antes y después de eliminar componentes.

## Pruebas de seguridad

Las pruebas de seguridad deben contemplar:

- autenticación;
- autorización;
- multi-tenancy;
- validación;
- CSRF;
- headers;
- manejo de errores;
- inyección;
- exposición de información;
- gestión de sesiones;
- límites de entrada.

Las pruebas deben complementar, no sustituir, herramientas de análisis estático y DAST.

## Pruebas de rendimiento

Las pruebas de rendimiento deben utilizarse para evaluar:

- latencia;
- throughput;
- concurrencia;
- consumo de memoria;
- consultas;
- endpoints críticos;
- frontend;
- operaciones de IA.

Los resultados deben registrarse con sus condiciones de ejecución para permitir comparaciones posteriores.

## Pruebas de carga

Las pruebas de carga deben diseñarse sobre escenarios representativos del uso esperado.

Deben evitarse cargas arbitrarias sin relación con los flujos reales.

Las pruebas deben identificar:

- punto de degradación;
- comportamiento bajo concurrencia;
- errores;
- consumo de recursos;
- recuperación después de la carga.

## Pruebas de recuperación

Cuando un componente externo o infraestructura falle, deben verificarse los mecanismos de recuperación disponibles.

Ejemplos:

- Redis no disponible;
- proveedor externo no disponible;
- timeout;
- conexión a base de datos fallida;
- proceso backend reiniciado.

La prueba debe confirmar que el sistema falla de manera controlada cuando no puede continuar.

## CI/CD

Las pruebas deben integrarse progresivamente en CI/CD.

El pipeline debe ejecutar, según el nivel configurado:

- instalación reproducible;
- lint;
- pruebas unitarias;
- pruebas de integración;
- cobertura;
- E2E;
- análisis estático;
- verificaciones de seguridad.

Los controles que dependan de servicios externos deben configurarse con ambientes reproducibles o dependencias explícitas.

## Criterios de aceptación

Un cambio puede considerarse técnicamente verificable cuando:

- las pruebas relevantes pasan;
- no existen regresiones conocidas;
- el lint correspondiente pasa;
- los contratos afectados permanecen coherentes;
- las validaciones funcionan;
- los controles de seguridad relevantes fueron revisados;
- la documentación afectada fue actualizada.

## Criterios para bloquear cambios

Un cambio debe considerarse candidato a bloqueo cuando:

- falla una prueba crítica;
- se rompe aislamiento multi-tenant;
- se permite acceso no autorizado;
- se altera incorrectamente una regla de negocio;
- se introducen regresiones graves;
- falla una migración de base de datos;
- se exponen secretos;
- se rompe un contrato crítico de API.

Los criterios exactos de bloqueo pueden ampliarse según el nivel de riesgo del cambio.

## Diagnóstico de fallos

Cuando una prueba falla se debe:

1. reproducir el fallo;
2. identificar el componente afectado;
3. revisar el mensaje de error;
4. determinar si es un fallo de código, prueba o ambiente;
5. corregir la causa;
6. ejecutar nuevamente la prueba;
7. ejecutar pruebas relacionadas;
8. verificar ausencia de regresión.

No debe modificarse una prueba únicamente para hacer desaparecer un fallo sin comprobar primero el comportamiento esperado.

## Evidencia

La evidencia de pruebas puede incluir:

- salida de Vitest;
- reportes de cobertura;
- resultados de Playwright;
- resultados de CI;
- logs relevantes;
- reportes de análisis;
- resultados de pruebas de rendimiento;
- evidencias de seguridad.

La evidencia debe conservarse cuando sea necesaria para demostrar una validación técnica o académica.

## Mantenimiento de pruebas

Las pruebas deben evolucionar junto con el código.

Cuando cambie:

- un contrato;
- una regla de negocio;
- un modelo;
- una ruta;
- un componente;
- una dependencia;
- una estructura de base de datos;

deben revisarse las pruebas relacionadas.

Las pruebas obsoletas deben actualizarse o eliminarse de forma justificada.

## Responsabilidad

Los cambios de código deben incluir la revisión de las pruebas afectadas.

La ausencia de una prueba existente no debe interpretarse como evidencia de que el comportamiento sea correcto.

Los flujos críticos deben mantener pruebas suficientes para detectar regresiones.

## Relación con otros documentos

Esta estrategia se complementa con:

- `docs/Arquitectura/architecture.md`
- `docs/API/api-contracts.md`
- `docs/Base de Datos/database.md`
- `docs/Observabilidad/observability.md`
- `docs/CI-CD/ci-cd.md`
- `docs/Decisiones Técnicas/technical-debt.md`
- `docs/Solucion de Problemas/troubleshooting.md`
- `docs/Despliegue/deployment.md`

## Mantenimiento del documento

Este documento debe actualizarse cuando se incorporen nuevos niveles de prueba, herramientas, ambientes, criterios de calidad o flujos críticos.

La estrategia debe mantenerse alineada con la arquitectura y con la evolución real del sistema.
