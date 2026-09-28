# Entorno de testing

## Descripción

El entorno de testing está destinado a la ejecución controlada de pruebas automatizadas y validaciones técnicas del sistema ERP/SaaS.

Su propósito es verificar los cambios antes de avanzar hacia entornos superiores y reducir el riesgo de introducir regresiones.

## Objetivo

El entorno permite:

- Ejecutar pruebas automatizadas.
- Validar el comportamiento del backend y frontend.
- Verificar integraciones entre componentes.
- Medir cobertura de pruebas.
- Ejecutar análisis estático.
- Validar procesos automatizados de CI/CD.
- Detectar regresiones antes del despliegue.

## Componentes

El entorno puede utilizar los mismos componentes principales de la aplicación, aislados de los datos y configuraciones de desarrollo y producción.

| Componente | Tecnología | Función |
|---|---|---|
| Frontend | React + Vite | Ejecución y validación de la interfaz |
| Backend | Node.js + Express | Ejecución y validación de la API |
| Base de datos | MySQL 8 | Persistencia requerida por pruebas de integración |
| Cache/estado auxiliar | Redis | Pruebas que requieren almacenamiento temporal |
| Runner de pruebas | Vitest | Pruebas automatizadas |
| E2E | Playwright | Pruebas de extremo a extremo |

## Aislamiento

El entorno de testing debe mantenerse separado de los datos utilizados por desarrollo y producción.

Las pruebas no deben modificar información perteneciente a otros entornos.

Cuando las pruebas requieran una base de datos, esta debe corresponder al entorno de testing y utilizar una configuración independiente.

## Pruebas unitarias

Las pruebas unitarias verifican componentes individuales del sistema de forma aislada.

El backend utiliza Vitest para ejecutar sus pruebas automatizadas.

El frontend también utiliza Vitest para validar componentes y lógica de presentación.

Las pruebas deben ejecutarse de forma determinista siempre que sea posible.

## Pruebas de integración

Las pruebas de integración verifican la interacción entre componentes del sistema.

Pueden involucrar:

- Controladores.
- Servicios.
- Repositorios.
- Middleware.
- Base de datos.
- Redis.
- Autenticación.
- Validaciones.
- Flujos de negocio.

Las pruebas que requieren servicios externos deben ejecutarse únicamente cuando las dependencias correspondientes estén disponibles.

## Pruebas E2E

Las pruebas de extremo a extremo utilizan Playwright para validar flujos completos desde la interfaz de usuario.

El entorno E2E utiliza el frontend ejecutándose mediante Vite y puede iniciar automáticamente el servidor requerido para las pruebas.

La configuración actual utiliza Chromium como navegador de ejecución.

## Cobertura

La cobertura se utiliza como una métrica de apoyo para identificar código que carece de pruebas.

No debe interpretarse como una garantía independiente de calidad.

La cobertura debe analizarse junto con:

- Importancia del código.
- Complejidad.
- Riesgo funcional.
- Casos límite.
- Errores esperados.
- Integración entre componentes.
- Flujos críticos.

## Variables de entorno

Las pruebas deben utilizar variables de entorno específicas del entorno de testing.

No deben utilizarse credenciales reales de producción.

Las variables necesarias dependen de los servicios requeridos por cada conjunto de pruebas.

## Datos de prueba

Los datos utilizados durante testing deben ser controlados y reproducibles.

Cuando una prueba modifica información persistente, debe existir un mecanismo para:

- Crear los datos necesarios.
- Ejecutar la prueba.
- Aislar los datos utilizados.
- Limpiar los datos cuando corresponda.

Las pruebas no deben depender de datos reales de usuarios o clientes.

## Ejecución local

Los desarrolladores pueden ejecutar las pruebas desde el entorno local cuando dispongan de las dependencias requeridas.

El flujo general es:

```text
Código
  │
  ▼
Instalación de dependencias
  │
  ▼
Configuración de testing
  │
  ▼
Pruebas unitarias
  │
  ▼
Pruebas de integración
  │
  ▼
Cobertura
  │
  ▼
Pruebas E2E
