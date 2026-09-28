# ERP SaaS - Carpintería de Vidrio y Aluminio

Plataforma web empresarial full-stack tipo ERP/SaaS orientada a negocios de carpintería de vidrio y aluminio.

El sistema centraliza procesos de clientes, materiales, inventario, proformas, pedidos, proveedores, facturación, autenticación, auditoría y funcionalidades asistidas por inteligencia artificial.

---

## Autor

**Anthony Alejandro Moreira Moreira**  
**Ingeniero en Software**

---

## Estado del proyecto

Proyecto en proceso de consolidación técnica.

Actualmente se trabaja en:

- Consolidación de la arquitectura modular.
- Eliminación progresiva de código legacy.
- Pruebas unitarias.
- Pruebas de integración.
- Pruebas End-to-End.
- Pruebas de rendimiento y concurrencia.
- Seguridad de la aplicación.
- Análisis estático con SonarCloud.
- Automatización CI/CD.
- Docker y reproducibilidad.
- Documentación técnica.
- Reducción de deuda técnica.

---

## Objetivo

Diseñar y consolidar una plataforma web empresarial tipo ERP/SaaS que permita centralizar y optimizar la gestión de proformas e inventario en negocios de carpintería de vidrio y aluminio.

---

## Funcionalidades principales

### Autenticación y usuarios

- Inicio de sesión.
- Cierre de sesión.
- Refresh tokens.
- Gestión de sesiones.
- Recuperación de contraseña.
- Control de acceso por roles.
- Invalidación de tokens.
- Auditoría de autenticación.

### Clientes

- Registro de clientes.
- Consulta de clientes.
- Actualización de información.
- Gestión asociada a la empresa.

### Inventario

- Gestión de materiales.
- Control de stock.
- Stock mínimo.
- Colores.
- Variantes de materiales.
- Proveedores.
- Relación proveedor-material.

### Proformas

- Creación de proformas.
- Gestión de medidas.
- Gestión de trabajos.
- Cálculo de precios.
- Gestión de detalles.
- Conversión a pedidos.

### Pedidos

- Creación de pedidos.
- Gestión de detalles.
- Estados.
- Cálculo de totales.
- Relación con proformas.

### Facturación

- Creación de facturas.
- Gestión de detalles.
- Cálculo de totales.
- Estados de factura.
- Información del cliente.
- Autorizaciones SRI.
- Secuencias de comprobantes.

### Inteligencia artificial

- Generación de imágenes.
- Visualización de trabajos.
- Gestión de referencias.
- Registro de solicitudes.
- Integración con servicios externos de IA.

### Administración

- Empresas.
- Usuarios.
- Configuración.
- Auditoría.
- Gestión de permisos.

---

# Arquitectura

El proyecto utiliza una arquitectura full-stack dividida entre frontend, backend y persistencia.

```text
┌───────────────────────────────────────────────┐
│                   FRONTEND                    │
│                                               │
│ React + Vite + React Query + Axios            │
│                                               │
│ Components / Hooks / Context / Services       │
└───────────────────────┬───────────────────────┘
                        │
                        │ HTTP / REST
                        ▼
┌───────────────────────────────────────────────┐
│                   BACKEND                     │
│                                               │
│ Node.js + Express                             │
│                                               │
│ Modules / Controllers / Services / Repositories│
└────────────────┬──────────────────┬───────────┘
                 │                  │
                 ▼                  ▼
        ┌────────────────┐  ┌────────────────┐
        │     MySQL      │  │     Redis      │
        │                │  │                │
        │ Persistencia   │  │ Sesiones /     │
        │ Integridad     │  │ cache / auth   │
        └────────────────┘  └────────────────┘
