# Entorno de staging

## Descripción

El entorno de staging representa una etapa previa a producción destinada a validar una versión del sistema bajo una configuración lo más cercana posible al entorno productivo.

Su propósito es detectar problemas de integración, configuración, seguridad, rendimiento y operación antes de realizar un despliegue productivo.

## Objetivo

El entorno permite:

- Validar versiones candidatas a producción.
- Verificar la integración entre frontend, backend, MySQL y Redis.
- Ejecutar pruebas E2E sobre una instalación integrada.
- Validar configuraciones específicas del despliegue.
- Comprobar health checks y comportamiento operativo.
- Realizar validaciones de seguridad.
- Verificar procesos de migración y recuperación.
- Reducir diferencias entre testing y producción.

## Componentes

La arquitectura de staging debe reproducir los componentes principales utilizados por producción.

| Componente | Tecnología | Función |
|---|---|---|
| Frontend | React + Vite | Interfaz de usuario |
| Backend | Node.js + Express | API y lógica de negocio |
| Base de datos | MySQL 8 | Persistencia |
| Cache/estado auxiliar | Redis | Servicios auxiliares |
| Automatización | CI/CD | Preparación y despliegue |

La infraestructura concreta de staging dependerá del proveedor y de la plataforma seleccionada para el despliegue definitivo.

## Aislamiento

Staging debe utilizar recursos, credenciales, bases de datos y configuraciones independientes de producción.

No debe conectarse accidentalmente a:

- Base de datos de producción.
- Redis de producción.
- Secretos de producción.
- Servicios internos exclusivos de producción.

El aislamiento debe verificarse antes de ejecutar pruebas que modifiquen información.

## Código desplegado

El código de staging debe corresponder a una versión identificable del repositorio.

Se recomienda desplegar:

- Una rama o commit definido por el flujo de CI/CD.
- Una versión etiquetada cuando corresponda.
- Dependencias determinadas mediante los archivos de bloqueo del proyecto.

La versión desplegada debe poder identificarse posteriormente para facilitar diagnóstico y rollback.

## Configuración

La configuración debe proporcionarse mediante variables de entorno y mecanismos de gestión de secretos.

Los valores específicos de staging no deben almacenarse directamente en el código fuente.

La configuración debe incluir, cuando corresponda:

- URL del frontend.
- URL de la API.
- Configuración de MySQL.
- Configuración de Redis.
- Secretos JWT.
- Configuración CSRF.
- Credenciales de servicios externos.
- Configuración de IA.
- Parámetros de ejecución del backend.

## Base de datos

Staging debe utilizar una base de datos independiente.

Las migraciones deben probarse previamente antes de aplicarse sobre producción.

Cuando sea necesario disponer de información representativa, deben utilizarse datos de prueba o datos anonimizados. No debe copiarse información productiva sensible sin un procedimiento autorizado y controles adecuados.

## Redis

La instancia de Redis utilizada por staging debe mantenerse separada de producción.

La configuración debe permitir validar los mecanismos que dependan de Redis, incluyendo los relacionados con autenticación, sesiones o revocación de tokens cuando correspondan.

## Validaciones

Antes de considerar una versión apta para producción se deben ejecutar las validaciones definidas para el proyecto.

Entre ellas pueden incluirse:

- Instalación de dependencias.
- Lint.
- Pruebas unitarias.
- Pruebas de integración.
- Cobertura.
- Pruebas E2E.
- Verificación del build.
- Health checks.
- Validaciones de seguridad.
- Verificación de migraciones.

## Pruebas E2E

Staging constituye un entorno apropiado para ejecutar pruebas E2E contra una instalación integrada.

Los flujos pueden validar la interacción completa entre:

```text
Navegador
    │
    ▼
Frontend
    │
    ▼
Backend
    │
    ├──► MySQL
    │
    └──► Redis
