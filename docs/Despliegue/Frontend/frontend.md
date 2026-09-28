# Despliegue del frontend

## Descripción

El frontend de la plataforma ERP/SaaS está construido con React y Vite. Su responsabilidad es proporcionar la interfaz web utilizada por los usuarios para gestionar las funcionalidades de la aplicación.

El frontend consume la API del backend mediante solicitudes HTTP y depende de la configuración de red, autenticación y seguridad definida para cada entorno.

---

## Objetivo

El despliegue del frontend debe garantizar:

- Construcción reproducible de la aplicación.
- Separación entre configuración de desarrollo, testing, staging y producción.
- Generación de un bundle optimizado para distribución.
- Comunicación correcta con el backend.
- Aplicación de las políticas de seguridad correspondientes.
- Disponibilidad de los recursos estáticos.
- Compatibilidad con el proceso de CI/CD.
- Posibilidad de revertir una versión desplegada.

---

## Tecnologías

El frontend utiliza principalmente:

| Componente | Tecnología |
|---|---|
| Framework de interfaz | React |
| Herramienta de construcción | Vite |
| Gestión de consultas | React Query |
| Pruebas unitarias | Vitest |
| Pruebas E2E | Playwright |
| Lenguaje principal | JavaScript/JSX |

La versión concreta de cada dependencia debe obtenerse del `package.json` y del lockfile del frontend.

---

## Estructura de ejecución

Durante el desarrollo, el frontend se ejecuta mediante el servidor de desarrollo de Vite.

La arquitectura actual utiliza:

```text
Navegador
    |
    v
Frontend React/Vite
    |
    | /api
    v
Backend Node/Express
    |
    +----> MySQL
    |
    +----> Redis
