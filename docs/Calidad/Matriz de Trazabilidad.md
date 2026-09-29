# Matriz de Trazabilidad

## Descripción

Este documento define la matriz de trazabilidad técnica de la plataforma ERP/SaaS para negocios de carpintería de vidrio y aluminio.

La matriz relaciona las capacidades funcionales y técnicas del sistema con sus componentes, documentación y mecanismos de verificación.

Su propósito es facilitar la identificación de qué parte del sistema implementa o soporta una determinada capacidad y qué evidencia puede utilizarse para comprobar su comportamiento.

## Objetivo

La trazabilidad permite:

- relacionar funcionalidades con componentes técnicos;
- identificar pruebas asociadas;
- localizar documentación relevante;
- detectar funcionalidades sin verificación suficiente;
- facilitar análisis de impacto;
- apoyar revisiones de arquitectura;
- apoyar mantenimiento y evolución;
- conservar evidencia técnica.

## Criterios

La trazabilidad debe mantenerse entre:

```text
Funcionalidad
     ↓
Módulo / componente
     ↓
API / persistencia
     ↓
Pruebas
     ↓
Documentación
```

No todas las funcionalidades requieren los mismos niveles de prueba. La profundidad de trazabilidad debe corresponder al riesgo y criticidad del flujo.

## Convenciones

| Elemento | Significado |
|---|---|
| Funcionalidad | Capacidad observable del sistema |
| Módulo | Área funcional o técnica responsable |
| API | Contrato mediante el cual se expone la capacidad |
| Persistencia | Entidades o mecanismos de almacenamiento relacionados |
| Prueba | Mecanismo utilizado para verificar el comportamiento |
| Documentación | Documento técnico relacionado |
| Estado | Situación actual de la trazabilidad |

## Trazabilidad funcional

| Funcionalidad | Módulo / componente | Persistencia / integración | Verificación | Documentación | Estado |
|---|---|---|---|---|---|
| Autenticación | Auth | `usuarios`, `usuarios_sesiones`, `token_blacklist`, Redis | Unitarias / integración / E2E | API, Arquitectura, Seguridad | Cubierto |
| Gestión de usuarios | Usuarios | `usuarios` | Unitarias / integración | API, Base de Datos | Cubierto |
| Gestión de clientes | Clientes | `clientes` | Unitarias / integración | API, Base de Datos | Cubierto |
| Gestión de materiales | Materiales | `materiales` | Unitarias / integración | API, Base de Datos | Cubierto |
| Gestión de colores | Materiales / Colores | `colores`, `material_colores` | Unitarias / integración | Base de Datos | Cubierto |
| Variantes de materiales | Materiales | `materiales_variantes` | Unitarias / integración | Base de Datos | Cubierto |
| Proveedores | Proveedores | `proveedores`, `proveedor_materiales` | Unitarias / integración | API, Base de Datos | Cubierto |
| Trabajos | Trabajos | `trabajos` | Unitarias / integración | API, Base de Datos | Cubierto |
| Recetas | Trabajos | `recetas` | Unitarias / integración | Base de Datos | Cubierto |
| Referencias de trabajos | Trabajos / IA | `trabajo_referencias` | Unitarias / integración | IA, Base de Datos | Cubierto |
| Proformas | Proformas | `proformas`, `proforma_items`, `proforma_detalle` | Unitarias / integración / E2E | API, Base de Datos | Cubierto |
| Pedidos | Pedidos | `pedidos`, `pedido_detalle` | Unitarias / integración / E2E | API, Base de Datos | Cubierto |
| Solicitudes de materiales | Inventario | `solicitudes_materiales`, `solicitud_items` | Unitarias / integración | Base de Datos | En verificación |
| Facturación | Facturación | `facturas`, `factura_detalle`, `autorizaciones_sri` | Unitarias / integración / E2E | API, Base de Datos, Cumplimiento | Cubierto |
| Secuencias de comprobantes | Facturación | `secuencias_comprobantes` | Integración | Base de Datos | Cubierto |
| Recuperación de contraseña | Auth | `password_resets` | Unitarias / integración | API, Base de Datos | Cubierto |
| Sesiones | Auth | `usuarios_sesiones`, Redis | Unitarias / integración | Arquitectura, API | Cubierto |
| Auditoría | Auditoría | `auditoria_acciones` | Unitarias / integración | Observabilidad, Base de Datos | Cubierto |
| Configuración | Configuración | `configuracion` | Unitarias / integración | Base de Datos | Cubierto |
| IA | IA | `ia_requests`, proveedores externos | Unitarias / integración | IA | Cubierto |
| Multi-tenancy | Middleware / repositorios / servicios | `empresa_id` | Unitarias / integración | Arquitectura, API, Base de Datos | Crítico |
| Logging | Observabilidad | Winston | Unitarias / integración | Observabilidad | Cubierto |
| Health checks | Backend | MySQL / Redis | Integración | Observabilidad, Despliegue | Cubierto |

## Trazabilidad de seguridad

| Control | Componente | Verificación | Documentación | Estado |
|---|---|---|---|---|
| Autenticación | Auth middleware / servicios | Unitarias / integración / E2E | Arquitectura / API | Cubierto |
| Autorización | Middleware / controladores | Unitarias / integración | Arquitectura / API | Cubierto |
| Multi-tenancy | `empresa_id` / middleware / repositorios | Unitarias / integración | Arquitectura / Base de Datos | Crítico |
| Validación de entrada | Zod | Unitarias / integración | API | Cubierto |
| CSRF | Cliente HTTP / backend | Integración | API / Arquitectura | Cubierto |
| Cookies seguras | Sesiones | Integración / E2E | Arquitectura | Cubierto |
| Blacklist de tokens | Redis / autenticación | Unitarias / integración | Arquitectura | Cubierto |
| Auditoría | `auditoria_acciones` | Integración | Observabilidad / Base de Datos | Cubierto |
| Headers de seguridad | Helmet / backend | Integración / DAST | Arquitectura / Despliegue | En verificación |
| Control de entrada en IA | Endpoints IA | Unitarias / integración | IA / API | Cubierto |
| Protección de secretos | Configuración / CI/CD | Revisión de configuración | CI/CD / Despliegue | Cubierto |
| Logging seguro | Winston | Unitarias / revisión | Observabilidad | Cubierto |

## Trazabilidad de persistencia

| Dominio | Entidades principales | Integridad | Documentación |
|---|---|---|---|
| Empresas | `empresas` | PK / unique / FK | Base de Datos |
| Usuarios | `usuarios`, `usuarios_sesiones` | PK / FK / unique | Base de Datos |
| Clientes | `clientes` | PK / FK / unique | Base de Datos |
| Inventario | `materiales`, `materiales_variantes`, `material_colores` | PK / FK / checks / unique | Base de Datos |
| Proveedores | `proveedores`, `proveedor_materiales` | PK / FK / unique | Base de Datos |
| Trabajos | `trabajos`, `recetas`, `trabajo_referencias` | PK / FK / unique | Base de Datos |
| Proformas | `proformas`, `proforma_items`, `proforma_detalle` | PK / FK | Base de Datos |
| Pedidos | `pedidos`, `pedido_detalle` | PK / FK / triggers | Base de Datos |
| Solicitudes | `solicitudes_materiales`, `solicitud_items` | PK / FK | Base de Datos |
| Facturación | `facturas`, `factura_detalle`, `autorizaciones_sri` | PK / FK / checks / unique / triggers | Base de Datos |
| Seguridad | `password_resets`, `token_blacklist` | PK / unique / FK | Base de Datos |
| Auditoría | `auditoria_acciones` | PK / FK / índices | Base de Datos |
| Configuración | `configuracion` | PK compuesta | Base de Datos |
| IA | `ia_requests` | PK / FK / índices | Base de Datos |

## Trazabilidad de pruebas

### Backend

El backend dispone de una suite automatizada de pruebas ejecutada mediante Vitest.

La trazabilidad debe mantenerse principalmente entre:

- módulos;
- servicios;
- controladores;
- repositorios;
- middleware;
- validadores;
- reglas de negocio.

Los cambios en funcionalidades críticas deben identificar las pruebas que validan el comportamiento afectado.

### Frontend

El frontend utiliza Vitest para pruebas unitarias y de componentes.

La trazabilidad debe mantenerse entre:

- componentes;
- hooks;
- utilidades;
- formularios;
- lógica de presentación;
- consumo de API.

### E2E

Playwright se utiliza para validar flujos completos.

La trazabilidad E2E debe concentrarse en los procesos de mayor impacto funcional.

## Trazabilidad de calidad

| Control | Herramienta / mecanismo | Evidencia |
|---|---|---|
| Lint backend | ESLint | Resultado de CI |
| Lint frontend | ESLint | Resultado de CI |
| Tests backend | Vitest | Resultado de ejecución |
| Tests frontend | Vitest | Resultado de ejecución |
| Cobertura | V8 / Vitest | Reporte de cobertura |
| E2E | Playwright | Reporte E2E |
| Análisis estático | SonarCloud | Análisis del proyecto |
| Seguridad dinámica | DAST / ZAP | Reporte de análisis |
| CI | GitHub Actions | Workflow |
| Rendimiento frontend | Lighthouse | Reporte de medición |
| Rendimiento backend | Pruebas de carga | Resultados de ejecución |

## Trazabilidad de CI/CD

El pipeline debe permitir identificar:

```text
Commit
   ↓
Workflow
   ↓
Instalación
   ↓
Lint
   ↓
Tests
   ↓
Cobertura
   ↓
Análisis adicional
   ↓
Artefactos / evidencia
```

Cuando se incorporen pruebas de integración, E2E, DAST o rendimiento al pipeline, deben agregarse a esta trazabilidad.

## Trazabilidad de cambios

Cada cambio relevante debería poder relacionarse con:

- commit;
- Pull Request cuando corresponda;
- archivos afectados;
- pruebas;
- documentación;
- impacto arquitectónico.

Los cambios estructurales deben documentar también sus efectos sobre componentes dependientes.

## Trazabilidad de decisiones

Las decisiones arquitectónicas relevantes deben relacionarse con:

- `docs/Decisiones Técnicas/decisions.md`;
- deuda técnica asociada;
- documentación arquitectónica;
- pruebas afectadas.

Esto permite identificar por qué existe una determinada estructura y qué consecuencias tendría modificarla.

## Trazabilidad de deuda técnica

Los problemas identificados mediante SonarCloud u otras herramientas deben poder relacionarse con:

- componente afectado;
- causa;
- tipo de deuda;
- riesgo;
- decisión técnica;
- cambio correctivo;
- pruebas;
- evidencia de cierre.

La trazabilidad evita tratar cada issue como un problema completamente independiente cuando varios proceden de una misma causa arquitectónica.

## Estados

Los estados utilizados en esta matriz son descriptivos y deben actualizarse conforme avance la verificación:

### Cubierto

Existe un mecanismo de implementación y verificación identificado.

### En verificación

Existe implementación, pero todavía requiere ampliar o confirmar evidencia.

### Pendiente

La capacidad o su verificación todavía no se encuentra suficientemente establecida.

### Crítico

El aspecto requiere atención prioritaria por su impacto potencial sobre seguridad, integridad, aislamiento o funcionamiento.

## Criterios de actualización

La matriz debe actualizarse cuando:

- se agregue una funcionalidad;
- cambie un módulo;
- cambie un contrato API;
- cambie una entidad;
- se agregue una prueba relevante;
- se elimine código legacy;
- se modifique una decisión arquitectónica;
- se cierre deuda técnica;
- se incorpore una herramienta de calidad.

## Limitaciones

La matriz no sustituye:

- pruebas automatizadas;
- documentación de arquitectura;
- contratos de API;
- documentación de base de datos;
- documentación de seguridad;
- registros de CI/CD;
- evidencia de ejecución.

Su función es relacionar estos elementos para facilitar su navegación y revisión.

## Mantenimiento

La matriz debe mantenerse sincronizada con el estado real del sistema.

No deben marcarse capacidades como verificadas únicamente porque exista documentación.

La condición `Cubierto` debe representar que existe una relación razonable entre implementación y mecanismo de verificación, no una garantía absoluta de ausencia de defectos.

## Documentación relacionada

- `docs/Calidad/Estrategia de Pruebas.md`
- `docs/Arquitectura/architecture.md`
- `docs/API/api-contracts.md`
- `docs/Base de Datos/database.md`
- `docs/Decisiones Técnicas/decisions.md`
- `docs/Decisiones Técnicas/technical-debt.md`
- `docs/CI-CD/ci-cd.md`
- `docs/Observabilidad/observability.md`
- `docs/Solucion de Problemas/troubleshooting.md`
