# Gestión de secretos

## Descripción

Este documento establece los criterios para identificar, almacenar, proteger, utilizar, rotar y revocar secretos utilizados por la plataforma ERP/SaaS.

Los secretos son valores confidenciales que permiten autenticar servicios, usuarios, sistemas o recursos protegidos. Su gestión debe mantenerse separada de la configuración no sensible y del código fuente.

Este documento complementa:

- [Configuración de entornos](./configuracion-entorno.md)
- [Variables de entorno](./variables-entorno.md)
- [Entorno de producción](../Entornos/produccion.md)
- [CI/CD de despliegue](../CI-CD/ci-cd-deployment.md)
- [Seguridad del despliegue](../Seguridad/seguridad-despliegue.md)

---

## Objetivo

La gestión de secretos tiene como objetivos:

- Evitar la exposición de credenciales y claves sensibles.
- Separar secretos del código fuente.
- Mantener diferentes credenciales por entorno.
- Limitar el acceso a los secretos según necesidad operativa.
- Permitir la rotación y revocación de credenciales.
- Evitar que los secretos aparezcan en logs, documentación o artefactos de compilación.
- Reducir el impacto ante una exposición accidental.
- Integrar el manejo de secretos con los procesos de CI/CD.

---

## Alcance

Esta política aplica a:

- Frontend.
- Backend.
- MySQL.
- Redis.
- Autenticación.
- Protección CSRF.
- Servicios de inteligencia artificial.
- Servicios externos utilizados por la aplicación.
- CI/CD.
- Infraestructura de despliegue.
- Herramientas de administración y operación.

No todos los valores de configuración son secretos. Las variables públicas y los parámetros operativos deben mantenerse separados de las credenciales.

---

## Identificación de secretos

Se consideran secretos todos los valores cuyo conocimiento por terceros pueda permitir acceso no autorizado, suplantación, modificación de información o utilización indebida de servicios.

Entre ellos se incluyen:

| Tipo | Ejemplos |
|---|---|
| Credenciales de base de datos | Contraseña de MySQL |
| Credenciales de Redis | Contraseña de Redis, cuando esté habilitada |
| Claves de autenticación | Secretos utilizados para firmar o validar tokens |
| Credenciales CSRF | Secretos utilizados para mecanismos de protección CSRF, cuando corresponda |
| API keys | Credenciales de servicios externos |
| Credenciales de IA | Claves utilizadas por proveedores de IA |
| Credenciales de infraestructura | Usuarios, claves o tokens de administración |
| Credenciales CI/CD | Tokens necesarios para ejecutar procesos automatizados |
| Certificados privados | Claves privadas asociadas a HTTPS u otros servicios |
| Credenciales de terceros | Usuarios, tokens o claves de servicios externos |

Los nombres concretos de secretos que todavía no estén definidos en la implementación no deben inventarse en la documentación.

---

## Clasificación

Los secretos pueden clasificarse según el impacto de una exposición:

### Críticos

Permiten comprometer directamente la aplicación, infraestructura o información sensible.

Ejemplos:

- Claves de firma de autenticación.
- Credenciales administrativas de producción.
- Credenciales con acceso completo a la base de datos.
- Claves privadas de infraestructura.

### Altos

Permiten acceder a servicios relevantes, aunque su alcance pueda estar limitado.

Ejemplos:

- Contraseñas de Redis.
- Credenciales de servicios externos.
- API keys con permisos sobre funcionalidades específicas.

### Operativos

Credenciales con alcance reducido y permisos estrictamente delimitados.

La clasificación definitiva debe realizarse considerando los permisos reales de cada credencial.

---

## Separación por entorno

Los secretos deben mantenerse separados entre:

- Desarrollo.
- Testing.
- Staging.
- Producción.

Una credencial utilizada en producción no debe reutilizarse innecesariamente en desarrollo o testing.

La separación permite:

- Reducir el alcance de una exposición.
- Evitar que pruebas modifiquen recursos reales.
- Revocar credenciales de un entorno sin afectar a los demás.
- Aplicar diferentes niveles de permisos.

La configuración específica de cada entorno se documenta en [Configuración de entornos](./configuracion-entorno.md).

---

## Desarrollo local

Los secretos utilizados durante el desarrollo local deben almacenarse mediante variables de entorno o mecanismos equivalentes que permanezcan fuera del repositorio.

Los archivos locales que contengan credenciales no deben incluirse en Git.

La configuración de desarrollo debe proporcionar valores suficientes para ejecutar la aplicación sin utilizar credenciales reales de producción.

Cuando sea necesario compartir una configuración de ejemplo, debe utilizarse un archivo de referencia sin valores reales.

Ejemplo conceptual:

```text
DB_HOST=...
DB_PORT=...
DB_USER=...
DB_PASSWORD=...
DB_NAME=...
