# Configuración del entorno

## Descripción

Este documento define los criterios para configurar los diferentes entornos de ejecución del sistema ERP/SaaS.

La configuración debe separar los valores específicos de desarrollo, testing, staging y producción, evitando que los cambios propios de un entorno se incorporen directamente al código fuente.

## Objetivo

Establecer una configuración reproducible y controlada para los servicios que componen el sistema.

## Principios de configuración

La configuración debe seguir los siguientes principios:

- Separación entre código y configuración.
- Separación entre entornos.
- No almacenar secretos en el repositorio.
- Utilizar variables de entorno para valores sensibles o dependientes del entorno.
- Mantener identificables las versiones desplegadas.
- Evitar configuraciones manuales no documentadas.
- Validar la configuración antes del despliegue.

## Entornos

La configuración se organiza en:

| Entorno | Propósito |
|---|---|
| Desarrollo | Programación y validación local |
| Testing | Pruebas automatizadas y técnicas |
| Staging | Validación previa a producción |
| Producción | Ejecución para usuarios finales |

Cada entorno debe utilizar sus propios valores de conexión, credenciales y servicios.

## Frontend

El frontend utiliza React y Vite.

Durante desarrollo se ejecuta mediante el servidor de desarrollo de Vite.

La URL de la API se obtiene mediante configuración del entorno y utiliza como valor predeterminado:

```text
/api
