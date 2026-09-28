# Entorno de producción

## Descripción

El entorno de producción corresponde al entorno destinado a proporcionar el sistema ERP/SaaS a sus usuarios finales.

Debe utilizar una configuración estable, controlada y separada de los entornos de desarrollo, testing y staging.

## Objetivo

El entorno de producción debe permitir:

- Ejecutar una versión validada del sistema.
- Proporcionar disponibilidad a los usuarios finales.
- Proteger la información persistente.
- Mantener trazabilidad de las versiones desplegadas.
- Supervisar el estado de los servicios.
- Registrar eventos relevantes.
- Facilitar la recuperación ante fallos.
- Permitir actualizaciones controladas.

## Componentes

La arquitectura productiva contempla los siguientes componentes principales:

| Componente | Tecnología | Responsabilidad |
|---|---|---|
| Frontend | React + Vite | Interfaz de usuario |
| Backend | Node.js + Express | API y lógica de negocio |
| Base de datos | MySQL 8 | Persistencia |
| Cache/estado auxiliar | Redis | Servicios auxiliares |
| Proxy o servidor web | Pendiente | Exposición y terminación HTTPS |
| Sistema de procesos | PM2 | Gestión del proceso backend |

La infraestructura definitiva de producción queda condicionada al proveedor y arquitectura de hosting seleccionados.

## Aislamiento

Producción debe mantenerse separada de los demás entornos.

No debe compartir directamente:

- Base de datos con desarrollo o testing.
- Redis con otros entornos.
- Secretos.
- Tokens.
- Archivos de configuración.
- Recursos destinados exclusivamente a pruebas.

Las conexiones deben utilizar credenciales específicas del entorno productivo.

## Versión desplegada

Cada despliegue debe corresponder a una versión identificable del repositorio.

La versión debe poder relacionarse con:

- Commit.
- Rama o etiqueta.
- Cambios incluidos.
- Resultado de las pruebas.
- Artefactos generados.
- Migraciones aplicadas.

Esto permite identificar con precisión qué versión se encuentra ejecutándose.

## Frontend

El frontend debe desplegarse a partir de un build generado para producción.

La configuración de producción debe utilizar las variables correspondientes al entorno productivo y no las utilizadas durante desarrollo.

El proceso general es:

```text
Código fuente
     │
     ▼
Instalación de dependencias
     │
     ▼
Validaciones
     │
     ▼
Build de producción
     │
     ▼
Artefacto frontend
     │
     ▼
Servidor web / hosting
