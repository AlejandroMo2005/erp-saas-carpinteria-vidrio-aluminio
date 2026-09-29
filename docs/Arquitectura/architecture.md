# Arquitectura del Sistema

## Descripción

Este documento describe la arquitectura técnica de la plataforma web empresarial tipo ERP/SaaS orientada a negocios de carpintería de vidrio y aluminio.

La arquitectura organiza el sistema en frontend, backend, persistencia, servicios auxiliares, seguridad, inteligencia artificial, observabilidad, pruebas y automatización del ciclo de desarrollo.

## Objetivo

Definir la estructura técnica del sistema, las responsabilidades de sus componentes y las relaciones entre las principales capas y servicios, manteniendo la documentación alineada con la implementación existente.

## Alcance

La arquitectura comprende:

- Frontend desarrollado con React y Vite.
- Backend desarrollado con Node.js y Express.
- API HTTP bajo `/api`.
- Persistencia mediante MySQL 8.
- Redis como componente auxiliar.
- Autenticación y gestión de sesiones.
- Aislamiento lógico por empresa.
- Servicios de inteligencia artificial.
- Validación y controles de seguridad.
- Logging, auditoría y observabilidad.
- Pruebas automatizadas.
- Integración continua.
- Migración progresiva de componentes legacy.

## Arquitectura General

La aplicación utiliza una arquitectura cliente-servidor.

El frontend proporciona la interfaz de usuario y consume la API HTTP del backend. El backend concentra la autenticación, autorización, validación, lógica de negocio, acceso a datos y coordinación con servicios externos.

MySQL 8 constituye el sistema principal de persistencia y Redis complementa la arquitectura para almacenamiento temporal y mecanismos asociados a la autenticación.

```text
Usuario
   │
   ▼
Frontend React
   │
   │ HTTP/JSON
   ▼
API Backend
   │
   ├── Autenticación
   ├── Autorización
   ├── Multi-tenancy
   ├── Validación
   ├── Lógica de negocio
   ├── Servicios
   └── Observabilidad
        │
        ├──────────────► MySQL 8
        │
        └──────────────► Redis

Backend
   │
   └──────────────► Servicios externos de IA
```

## Frontend

El frontend está construido con React y Vite.

Sus responsabilidades principales son:

- Presentar la interfaz de usuario.
- Gestionar la interacción con el usuario.
- Consumir la API backend.
- Gestionar el estado asociado a las consultas mediante React Query.
- Gestionar las solicitudes HTTP mediante Axios.
- Aplicar los mecanismos de seguridad requeridos para la comunicación con la API.

### Tecnologías

- React.
- Vite.
- React Query.
- Axios.
- Vitest.
- Playwright.

### Comunicación con la API

Axios utiliza como URL base:

```text
VITE_API_URL || /api
```

Durante el desarrollo, Vite utiliza un proxy para dirigir las solicitudes `/api` hacia el backend.

El frontend se ejecuta en el puerto 3000 durante el desarrollo y el backend en el puerto 5000.

### Gestión de tokens

El access token se mantiene en memoria.

El refresh token utiliza una cookie `httpOnly`.

Las solicitudes que requieren protección CSRF utilizan la cookie correspondiente y el encabezado `X-CSRF-Token`.

## Backend

El backend está construido con Node.js y Express.

Su responsabilidad comprende:

- Exponer la API.
- Procesar solicitudes HTTP.
- Aplicar autenticación y autorización.
- Validar entradas.
- Aplicar las reglas de negocio.
- Gestionar el contexto de empresa.
- Coordinar servicios internos.
- Gestionar la persistencia.
- Integrar servicios externos.
- Registrar información relevante para observabilidad y auditoría.

La estructura actual se organiza principalmente mediante:

```text
backend/
├── src/
│   ├── modules/
│   └── shared/
├── __tests__/
├── app.js
└── server.js
```

## Arquitectura Modular

El directorio `src/modules` contiene las funcionalidades organizadas por dominio.

El directorio `src/shared` contiene componentes reutilizables y responsabilidades transversales.

Esta separación permite reducir el acoplamiento y evita concentrar toda la lógica del sistema en controladores o servicios monolíticos.

Los componentes compartidos incluyen responsabilidades relacionadas con middleware, validación, servicios y utilidades comunes.

## API

El backend expone la API bajo el prefijo:

```text
/api
```

La comunicación entre frontend y backend utiliza HTTP y datos estructurados principalmente en JSON.

La definición de los contratos de API se documenta separadamente en:

[`docs/API/api-contracts.md`](../API/api-contracts.md)

La documentación arquitectónica no sustituye la implementación de las rutas. Los cambios en los contratos deben mantenerse sincronizados entre backend, frontend, pruebas y documentación.

## Multi-tenancy

El sistema utiliza un modelo de aislamiento lógico basado en `empresa_id`.

Las entidades pertenecientes a una empresa mantienen la identificación de la empresa correspondiente.

El middleware de tenant establece el contexto mediante:

```text
req.empresaId
```

Las operaciones que trabajan con datos empresariales deben conservar este contexto en consultas, modificaciones y eliminaciones.

El aislamiento por empresa constituye una responsabilidad transversal de seguridad y persistencia.

## Persistencia

MySQL 8 constituye el sistema principal de persistencia.

La base de datos `inventario_proformas` contiene información relacionada con:

- Empresas.
- Usuarios.
- Clientes.
- Materiales.
- Colores.
- Variantes de materiales.
- Proveedores.
- Trabajos.
- Recetas.
- Referencias de trabajos.
- Proformas.
- Pedidos.
- Solicitudes de materiales.
- Facturación.
- Sesiones.
- Auditoría.
- Solicitudes de IA.
- Configuración.

La documentación especializada se encuentra en:

[`docs/Base de Datos/database.md`](../Base%20de%20Datos/database.md)

La arquitectura de persistencia contempla claves foráneas, restricciones, índices, triggers y procedimientos almacenados según las necesidades definidas por el esquema actual.

## Redis

Redis se utiliza como componente auxiliar para almacenamiento temporal y mecanismos asociados a la autenticación.

Entre sus responsabilidades se encuentra el soporte de la lista de tokens revocados.

Redis complementa la persistencia principal de MySQL y no sustituye al sistema de base de datos relacional.

## Autenticación y Gestión de Sesiones

La autenticación utiliza tokens JWT y mecanismos complementarios de gestión de sesiones.

El sistema utiliza un `jti` para identificar los tokens y dispone de mecanismos para revocar tokens mediante una lista de bloqueo.

El flujo general es:

```text
Credenciales
    │
    ▼
Autenticación
    │
    ▼
Access Token + Refresh Token
    │
    ├── Access Token en memoria
    │
    └── Refresh Token mediante cookie httpOnly
```

Las sesiones de usuario también se registran en la base de datos mediante `usuarios_sesiones`.

## Seguridad

La seguridad se incorpora como una responsabilidad transversal.

Entre los mecanismos utilizados se encuentran:

- Validación mediante Zod.
- Helmet.
- Content Security Policy.
- HSTS.
- Trusted Types.
- Protección CSRF.
- Autenticación y autorización.
- Revocación de tokens.
- Rate limiting.
- Gestión de secretos mediante variables de entorno.
- Auditoría de determinadas acciones.
- Aislamiento lógico por empresa.
- Registro de eventos relevantes.

Las medidas de seguridad deben mantenerse en los límites de entrada, las capas de negocio, la persistencia y las integraciones externas.

## Inteligencia Artificial

La plataforma integra servicios externos de inteligencia artificial para funcionalidades relacionadas con procesamiento y generación de imágenes.

La integración contempla:

- Stability AI.
- Claude Vision.
- Replicate.

Las solicitudes relacionadas con IA se registran en `ia_requests`.

Esta entidad permite conservar información operativa como tipo de trabajo, prompt, hash de imagen de entrada, modelo, resultado, duración y estado de la solicitud.

Los servicios externos se mantienen desacoplados de la lógica principal mediante servicios especializados.

Los errores de los proveedores externos deben tratarse sin comprometer la estabilidad del resto de la aplicación.

La documentación específica se encuentra en:

[`docs/IA/ai.md`](../IA/ai.md)

## Observabilidad

La arquitectura incorpora mecanismos para registrar, supervisar y diagnosticar el comportamiento de la aplicación.

Las principales áreas son:

- Logging.
- Métricas.
- Health checks.
- Monitoreo.
- Alertas.
- Trazabilidad.
- Auditoría.
- Rendimiento.
- Seguridad.
- Diagnóstico.

La documentación especializada se encuentra en:

[`docs/Observabilidad/observability.md`](../Observabilidad/observability.md)

## Testing

La arquitectura contempla pruebas automatizadas en diferentes niveles.

### Backend

El backend utiliza Vitest para las pruebas automatizadas y V8 para la medición de cobertura.

Las pruebas abarcan módulos, servicios, controladores, middleware y otros componentes de la aplicación.

### Frontend

El frontend utiliza Vitest para pruebas unitarias y de componentes.

### End-to-End

Playwright se utiliza para las pruebas end-to-end.

La configuración utiliza el frontend disponible en el puerto 3000 y puede iniciar el servidor de desarrollo durante la ejecución de las pruebas.

## Calidad del Código

ESLint se utiliza para el análisis estático del código.

SonarCloud complementa el análisis mediante detección de problemas de confiabilidad, mantenibilidad, seguridad y duplicación.

La calidad del código se controla mediante pruebas automatizadas, análisis estático y revisión de los cambios realizados.

## CI/CD

El proyecto utiliza GitHub Actions para automatizar tareas del ciclo de integración.

Los flujos incluyen actividades relacionadas con instalación de dependencias, linting, pruebas y cobertura.

La documentación específica se encuentra en:

[`docs/CI-CD/ci-cd.md`](../CI-CD/ci-cd.md)

## Gestión de Componentes Legacy

El proyecto mantiene una estrategia de migración progresiva desde componentes legacy hacia la arquitectura modular actual.

La migración debe seguir el flujo:

```text
Identificar consumidor
        │
        ▼
Migrar dependencias
        │
        ▼
Validar comportamiento
        │
        ▼
Ejecutar pruebas
        │
        ▼
Eliminar componente legacy
        │
        ▼
Validar nuevamente
```

No se deben eliminar componentes legacy únicamente por duplicación aparente. Antes de eliminarlos se debe comprobar que no existan consumidores activos y que la funcionalidad correspondiente se encuentre cubierta por la arquitectura vigente.

## Principios Arquitectónicos

La evolución de la arquitectura se basa en los siguientes principios:

- Separación de responsabilidades.
- Modularidad.
- Bajo acoplamiento.
- Reutilización de componentes compartidos.
- Aislamiento por empresa.
- Validación en los límites del sistema.
- Seguridad por capas.
- Pruebas automatizadas.
- Observabilidad.
- Evolución incremental.
- Eliminación controlada de componentes legacy.
- Trazabilidad de decisiones técnicas.

## Estado Actual

La arquitectura actual combina componentes modernos bajo `src/modules` y `src/shared` con componentes legacy que se encuentran en proceso de migración o eliminación.

La deuda técnica y la duplicación identificadas durante el análisis de calidad deben abordarse de manera progresiva, priorizando cambios que reduzcan simultáneamente complejidad, duplicación y riesgo de regresión.

## Documentación Relacionada

- [`API — Contratos de API`](../API/api-contracts.md)
- [`Base de Datos`](../Base%20de%20Datos/database.md)
- [`CI/CD`](../CI-CD/ci-cd.md)
- [`Decisiones Técnicas`](../Decisiones%20Técnicas/decisions.md)
- [`Deuda Técnica`](../Decisiones%20Técnicas/technical-debt.md)
- [`Despliegue`](../Despliegue/deployment.md)
- [`Inteligencia Artificial`](../IA/ai.md)
- [`Observabilidad`](../Observabilidad/observability.md)
- [`Solución de Problemas`](../Solucion%20de%20Problemas/troubleshooting.md)
- [`Documentación Legal`](../Documentación%20Legal/compliance.md)

## Mantenimiento del Documento

Este documento debe actualizarse cuando se produzcan cambios arquitectónicos relevantes en la estructura del frontend, backend, persistencia, autenticación, seguridad, integraciones externas, observabilidad, pruebas o infraestructura.

Las decisiones que modifiquen de forma significativa la arquitectura deben registrarse también en:

[`docs/Decisiones Técnicas/decisions.md`](../Decisiones%20Técnicas/decisions.md)
