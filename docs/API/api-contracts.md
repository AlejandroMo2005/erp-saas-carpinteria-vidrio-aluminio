# Contratos de API

## Descripción

Este documento define los criterios generales para los contratos de comunicación entre el frontend y el backend de la plataforma ERP/SaaS.

El contrato de API establece las reglas que deben mantenerse consistentes entre consumidores y proveedores del servicio, incluyendo estructura general, autenticación, validación, seguridad, errores y evolución de los endpoints.

## Objetivo

Mantener una referencia central para los principios que deben cumplir los endpoints de la API y facilitar la coordinación entre frontend, backend, pruebas y documentación.

## Alcance

Este documento contempla:

- Base de la API.
- Comunicación HTTP.
- Formato de intercambio de información.
- Autenticación.
- Gestión de sesión.
- Multi-tenancy.
- Validación de entradas.
- Protección CSRF.
- Manejo de errores.
- Seguridad.
- Integración con servicios externos.
- Pruebas de contratos y endpoints.
- Evolución de la API.

La definición concreta de cada endpoint debe mantenerse alineada con las rutas implementadas en el backend.

## Base de la API

La API se expone bajo el prefijo:

```text
/api
```

Durante el desarrollo, el frontend utiliza `/api` como ruta base y Vite redirige dichas solicitudes hacia el backend disponible en el puerto 5000.

La URL de API del frontend puede configurarse mediante:

```text
VITE_API_URL
```

Cuando esta variable no está definida, se utiliza:

```text
/api
```

## Comunicación

La comunicación entre frontend y backend se realiza mediante HTTP.

El intercambio de información utiliza JSON en las operaciones que requieren cuerpos estructurados.

Las solicitudes deben utilizar el método HTTP correspondiente a la operación que realizan y respetar las reglas de autenticación, autorización y validación definidas por el backend.

## Métodos HTTP

Los endpoints deben utilizar los métodos HTTP de acuerdo con la naturaleza de la operación:

| Método | Uso |
|---|---|
| `GET` | Consulta de información |
| `POST` | Creación o ejecución de operaciones |
| `PUT` | Actualización completa cuando corresponda |
| `PATCH` | Actualización parcial cuando corresponda |
| `DELETE` | Eliminación o desactivación cuando corresponda |

La utilización de cada método debe mantenerse coherente con la semántica de la operación implementada.

## Autenticación

Los endpoints protegidos requieren un contexto de autenticación válido.

El sistema utiliza tokens JWT para la autenticación.

El access token se mantiene en memoria en el frontend.

El refresh token se gestiona mediante una cookie `httpOnly`.

La arquitectura utiliza un identificador `jti` para los tokens y mecanismos de revocación mediante una lista de bloqueo.

Los mecanismos de autenticación y renovación de sesión deben mantener coherencia entre frontend, backend, Redis y persistencia.

## Gestión de Sesiones

Las sesiones de usuario se registran mediante la estructura `usuarios_sesiones`.

El sistema contempla información asociada a la sesión como:

- Usuario.
- Hash del token.
- Dirección IP.
- User agent.
- Fecha de expiración.
- Fecha de creación.
- Último uso.

La revocación de tokens se complementa mediante el mecanismo de blacklist.

## Multi-tenancy

La API utiliza `empresa_id` como mecanismo de aislamiento lógico entre empresas.

El backend establece el contexto de empresa mediante el middleware correspondiente y expone dicho contexto mediante:

```text
req.empresaId
```

Los endpoints que operan sobre información empresarial deben garantizar que las consultas y modificaciones se ejecuten dentro del contexto de la empresa autenticada.

No se debe confiar en un identificador de empresa proporcionado directamente por el cliente cuando el contexto pueda obtenerse de la sesión autenticada.

El aislamiento debe mantenerse en:

- Consultas.
- Inserciones.
- Actualizaciones.
- Eliminaciones.
- Relaciones entre entidades.
- Operaciones administrativas.
- Procesos derivados.

## Validación de Entrada

La API utiliza Zod para validar información recibida desde los clientes.

La validación debe realizarse antes de procesar los datos en la lógica de negocio.

Los datos recibidos desde el cliente deben considerarse no confiables hasta completar la validación correspondiente.

La validación debe contemplar, según la operación:

- Tipos de datos.
- Campos requeridos.
- Campos opcionales.
- Longitudes.
- Rangos.
- Formatos.
- Valores permitidos.
- Relaciones entre campos.

La validación del backend constituye la autoridad final, independientemente de las validaciones realizadas previamente en el frontend.

## Protección CSRF

Las solicitudes que modifican información utilizan protección contra CSRF.

El frontend obtiene el token CSRF mediante el mecanismo correspondiente y lo envía mediante:

```text
X-CSRF-Token
```

El uso de cookies en la comunicación con la API requiere mantener esta protección alineada con la configuración de autenticación.

## Autorización

La autenticación determina la identidad del usuario, mientras que la autorización determina si dicho usuario puede realizar una operación determinada.

Los endpoints protegidos deben verificar el contexto de usuario y el rol o permisos correspondientes antes de ejecutar operaciones sensibles.

La autorización debe mantenerse en el backend y no depender exclusivamente de controles implementados en la interfaz.

## Respuestas HTTP

Los endpoints deben utilizar códigos de estado HTTP coherentes con el resultado de la operación.

Como referencia general:

| Código | Significado |
|---|---|
| `200` | Operación procesada correctamente |
| `201` | Recurso creado correctamente |
| `204` | Operación correcta sin contenido de respuesta |
| `400` | Solicitud inválida |
| `401` | Autenticación requerida o inválida |
| `403` | Operación no autorizada |
| `404` | Recurso no encontrado |
| `409` | Conflicto con el estado actual |
| `422` | Datos no válidos para la operación |
| `429` | Límite de solicitudes excedido |
| `500` | Error interno del servidor |
| `502` | Error asociado a un servicio externo |
| `503` | Servicio temporalmente no disponible |

El código utilizado debe corresponder al comportamiento real del endpoint y no debe utilizarse únicamente como sustituto de información detallada sobre el error.

## Manejo de Errores

Los errores de API deben procesarse de forma controlada y no deben exponer información interna innecesaria.

Los mensajes dirigidos al cliente deben diferenciar entre:

- Errores de validación.
- Errores de autenticación.
- Errores de autorización.
- Recursos inexistentes.
- Conflictos de negocio.
- Errores de infraestructura.
- Errores de servicios externos.

Los detalles técnicos necesarios para diagnóstico deben registrarse mediante los mecanismos de observabilidad correspondientes, sin exponer secretos o información sensible en la respuesta HTTP.

## Seguridad de los Datos

La API debe proteger la información recibida y procesada.

No deben incluirse en respuestas datos sensibles que no sean necesarios para el consumidor.

Las credenciales, tokens, secretos y demás información de seguridad no deben exponerse mediante respuestas, mensajes de error o logs.

La validación, autenticación, autorización y aislamiento por empresa deben aplicarse independientemente de las restricciones existentes en el frontend.

## Límites de Entrada

Los endpoints que procesan contenido potencialmente grande deben disponer de límites apropiados.

Esto resulta especialmente relevante para operaciones relacionadas con imágenes y referencias utilizadas por las funcionalidades de inteligencia artificial.

Los límites deben establecerse de acuerdo con la finalidad del endpoint y validarse antes de procesar el contenido.

## Integración con Servicios Externos

Algunos endpoints coordinan servicios externos relacionados con inteligencia artificial.

Estas integraciones deben aislarse de la lógica principal de la API mediante servicios especializados.

Los errores de proveedores externos deben transformarse en respuestas controladas para el consumidor.

La API no debe exponer directamente detalles internos de los proveedores, credenciales ni información sensible utilizada para realizar las solicitudes.

La documentación específica de IA se encuentra en:

[`docs/IA/ai.md`](../IA/ai.md)

## Idempotencia y Operaciones Críticas

Las operaciones que produzcan efectos persistentes o financieros deben analizarse individualmente para determinar sus requisitos de idempotencia.

Esto resulta especialmente relevante para operaciones como:

- Creación de documentos.
- Facturación.
- Cambios de estado.
- Operaciones de inventario.
- Procesamiento de solicitudes externas.

La estrategia concreta debe definirse según el comportamiento requerido por cada operación y no debe asumirse como implementada cuando no exista evidencia en el código.

## Contratos entre Frontend y Backend

Los cambios en un endpoint deben evaluarse considerando simultáneamente:

- Ruta.
- Método HTTP.
- Parámetros.
- Query parameters.
- Cuerpo de solicitud.
- Autenticación.
- Autorización.
- Respuesta.
- Códigos de estado.
- Errores.
- Validaciones.
- Consumidores existentes.

Cuando un contrato cambia, deben revisarse sus consumidores en frontend y las pruebas relacionadas.

## Versionado

La API actual utiliza el prefijo:

```text
/api
```

No se debe introducir una versión adicional como `/v1` únicamente por criterio documental.

La estrategia de versionado deberá definirse cuando exista una necesidad real de mantener contratos incompatibles simultáneamente.

## Pruebas de API

Los contratos deben validarse mediante pruebas automatizadas.

Las pruebas deben cubrir, según el endpoint:

- Solicitudes válidas.
- Datos inválidos.
- Falta de autenticación.
- Falta de autorización.
- Aislamiento por empresa.
- Recursos inexistentes.
- Conflictos.
- Errores internos.
- Casos límite.
- Integraciones externas cuando corresponda.

Las pruebas de integración deben comprobar la interacción entre las diferentes capas involucradas y no limitarse exclusivamente a funciones aisladas.

## Evolución de los Contratos

Los contratos deben evolucionar de forma compatible siempre que sea posible.

Antes de modificar un endpoint se debe identificar:

1. Consumidores actuales.
2. Dependencias internas.
3. Pruebas existentes.
4. Impacto sobre autenticación y autorización.
5. Impacto sobre multi-tenancy.
6. Impacto sobre persistencia.
7. Impacto sobre documentación.

Las modificaciones incompatibles deben tratarse como cambios arquitectónicos y registrarse en las decisiones técnicas cuando corresponda.

## Relación con la Arquitectura

La API forma parte de la capa de comunicación entre frontend y backend.

Su diseño debe respetar la separación de responsabilidades definida por la arquitectura general:

```text
Frontend
    │
    ▼
API
    │
    ▼
Módulos de negocio
    │
    ├── Servicios
    ├── Validadores
    └── Persistencia
```

La documentación arquitectónica general se encuentra en:

[`docs/Arquitectura/architecture.md`](../Arquitectura/architecture.md)

## Documentación Relacionada

- [`Arquitectura`](../Arquitectura/architecture.md)
- [`Base de Datos`](../Base%20de%20Datos/database.md)
- [`Seguridad de Observabilidad`](../Observabilidad/Seguridad/seguridad.md)
- [`Trazabilidad`](../Observabilidad/Trazabilidad/trazabilidad.md)
- [`Testing y CI/CD`](../CI-CD/ci-cd.md)
- [`Inteligencia Artificial`](../IA/ai.md)
- [`Solución de Problemas`](../Solucion%20de%20Problemas/troubleshooting.md)
- [`Decisiones Técnicas`](../Decisiones%20Técnicas/decisions.md)

## Mantenimiento del Documento

Este documento debe actualizarse cuando se modifiquen los contratos de comunicación entre frontend y backend.

Los cambios en rutas, autenticación, validación, respuestas, códigos de estado o reglas de seguridad deben revisarse junto con las pruebas correspondientes.

La documentación debe representar el comportamiento real de la API y no una implementación futura o hipotética.
