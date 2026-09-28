# Variables de entorno

## Descripción

Las variables de entorno permiten separar la configuración del sistema del código fuente y adaptar la ejecución de la aplicación a cada entorno.

Se utilizan principalmente para definir conexiones, URLs, credenciales, secretos y parámetros cuyo valor cambia entre desarrollo, testing, staging y producción.

## Objetivo

Establecer los criterios para definir, administrar, validar y proteger las variables utilizadas por el sistema.

## Principios

Las variables de entorno deben cumplir los siguientes principios:

- No contener secretos directamente en el código fuente.
- Mantener valores independientes por entorno.
- No reutilizar credenciales de producción en desarrollo o testing.
- Evitar exponer secretos al frontend.
- Validar las variables requeridas antes de iniciar servicios críticos.
- Mantener documentados los nombres y propósitos de las variables.
- Gestionar los valores reales mediante mecanismos seguros.

## Clasificación

Las variables pueden clasificarse en:

| Tipo | Ejemplo de uso | Sensibilidad |
|---|---|---|
| Configuración de aplicación | Puerto del backend | Baja |
| Conexión | Host de MySQL | Media |
| URL | URL de la API | Baja/Media |
| Credenciales | Usuario de base de datos | Alta |
| Secretos | Claves JWT | Crítica |
| Servicios externos | API keys de proveedores | Crítica |

## Frontend

El frontend utiliza variables de entorno proporcionadas por Vite.

La configuración puede incluir la URL utilizada para comunicarse con el backend.

El valor predeterminado utilizado para la API es:

```text
/api
