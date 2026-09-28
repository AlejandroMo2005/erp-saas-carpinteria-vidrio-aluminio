# Despliegue del backend

## Descripción

El backend de la plataforma ERP/SaaS está construido sobre Node.js y Express. Proporciona la API que permite al frontend acceder a las funcionalidades empresariales, autenticación, persistencia de información, gestión de sesiones y servicios auxiliares.

El backend mantiene comunicación con MySQL para persistencia y Redis para funcionalidades relacionadas con sesiones, tokens y mecanismos de soporte operativo.

---

## Objetivo

El despliegue del backend debe garantizar:

- Ejecución reproducible de la aplicación.
- Separación de configuración por entorno.
- Disponibilidad de la API.
- Conectividad controlada con MySQL y Redis.
- Protección de credenciales y secretos.
- Gestión segura de autenticación y sesiones.
- Aplicación de controles de seguridad HTTP.
- Supervisión del proceso.
- Capacidad de reinicio y recuperación.
- Integración con CI/CD.
- Posibilidad de rollback.

---

## Tecnologías

El backend utiliza principalmente:

| Componente | Tecnología |
|---|---|
| Runtime | Node.js |
| Framework HTTP | Express |
| Base de datos | MySQL 8 |
| Caché/estado auxiliar | Redis |
| Gestor de procesos | PM2 |
| Validación | Zod |
| Logging | Winston |
| Pruebas | Vitest |
| Seguridad HTTP | Helmet |
| Pruebas de seguridad | OWASP ZAP |

La versión objetivo documentada del runtime es Node.js 20.19.4.

---

## Estructura de ejecución

La arquitectura actual puede representarse de la siguiente manera:

```text
Cliente
   |
   v
Frontend
   |
   | HTTP/HTTPS
   v
Backend Node.js + Express
   |
   +--------> MySQL 8
   |
   +--------> Redis
   |
   +--------> Servicios externos / IA
