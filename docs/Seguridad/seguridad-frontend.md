# Seguridad del Frontend

## 1. Propósito

Este documento establece los controles de seguridad aplicables al frontend de la plataforma ERP/SaaS.

El frontend constituye una superficie de interacción con usuarios y servicios externos. Su función de seguridad consiste principalmente en reducir exposición, validar información para mejorar la experiencia, proteger sesiones y aplicar correctamente los mecanismos de comunicación con el backend.

Los controles de autorización y protección de recursos deben permanecer en el backend.

---

## 2. Alcance

Este documento aplica a:

- Aplicación React.
- Vite.
- React Query.
- Axios.
- Rutas protegidas.
- Gestión de sesión.
- Formularios.
- Validación de datos.
- Subida de archivos.
- Integración con API.
- CSRF.
- CORS.
- Manejo de errores.
- Variables de entorno.
- Almacenamiento del navegador.
- Renderizado de contenido.
- Integraciones de IA.
- Dependencias frontend.

---

## 3. Principios

El frontend debe aplicar:

1. No confiar en el cliente como mecanismo de autorización.
2. No almacenar secretos.
3. Minimizar la información persistida en el navegador.
4. Validar datos antes de enviarlos.
5. Evitar renderizado inseguro.
6. Proteger las solicitudes mutables.
7. Manejar errores sin revelar información interna.
8. Mantener dependencias controladas.
9. Mantener una superficie de ataque reducida.
10. Verificar los controles mediante pruebas.

---

## 4. Modelo de confianza

El frontend se ejecuta en un entorno controlado por el usuario final.

Por esta razón:

```text
Frontend
   ↓
NO es una frontera de seguridad confiable
   ↓
Backend
   ↓
Autenticación
   ↓
Autorización
   ↓
Tenant
   ↓
Persistencia
```

Un usuario puede modificar solicitudes, JavaScript, parámetros y comportamiento del navegador.

Por tanto, ninguna restricción implementada exclusivamente en React debe considerarse un control de seguridad suficiente.

---

## 5. Autorización

El frontend puede:

- Ocultar opciones.
- Mostrar u ocultar módulos.
- Adaptar menús según rol.
- Evitar acciones claramente inválidas.
- Mostrar mensajes de acceso denegado.

Sin embargo, el backend debe volver a validar:

- Usuario.
- Rol.
- Empresa.
- Recurso.
- Acción.

La ocultación de un botón no constituye autorización.

---

## 6. Gestión de tokens

La arquitectura actual utiliza:

- Access token mantenido en memoria.
- Refresh token mediante cookie `httpOnly`.
- Mecanismos de revocación mediante Redis y MySQL.

El frontend no debe:

- Exponer refresh tokens mediante JavaScript.
- Registrar tokens en consola.
- Incluir tokens en URLs.
- Persistir innecesariamente tokens sensibles.
- Enviar tokens a servicios externos.

Los mecanismos concretos deben mantenerse coordinados con el backend.

---

## 7. Almacenamiento del navegador

Debe evitarse almacenar información sensible innecesariamente en:

- `localStorage`.
- `sessionStorage`.
- IndexedDB.
- Cookies accesibles mediante JavaScript.

Especialmente no deben almacenarse:

- Contraseñas.
- Refresh tokens.
- Secretos.
- Claves API.
- Credenciales de proveedores.

Cuando una información pueda mantenerse únicamente en memoria, debe evaluarse esta opción antes de persistirla en el navegador.

---

## 8. Cookies

Las cookies relacionadas con autenticación deben configurarse según el nivel de protección requerido.

Cuando corresponda deben utilizar:

- `HttpOnly`.
- `Secure`.
- `SameSite`.

El frontend no debe intentar leer mediante JavaScript una cookie que esté diseñada para permanecer protegida mediante `HttpOnly`.

---

## 9. CSRF

Las solicitudes que modifiquen datos deben utilizar el mecanismo CSRF establecido por la aplicación.

El cliente debe:

- Obtener el token cuando corresponda.
- Enviarlo en el header requerido.
- Mantener la configuración consistente con Axios.
- Evitar incluirlo en URLs.
- No registrar su valor en logs.

La configuración actual del cliente utiliza `withCredentials` y mecanismos de protección para solicitudes mutables.

---

## 10. Axios y API

El cliente HTTP debe mantener una configuración centralizada.

La configuración actual utiliza:

```text
VITE_API_URL || /api
```

y `withCredentials` para permitir el funcionamiento de mecanismos basados en cookies.

Las solicitudes mutables deben incluir las protecciones requeridas por el backend.

No deben crearse múltiples clientes HTTP con configuraciones de seguridad incompatibles sin una razón técnica documentada.

---

## 11. Variables de entorno

Las variables expuestas mediante Vite pueden terminar formando parte del código enviado al navegador.

Por tanto:

```text
VITE_*
```

no debe contener secretos de backend.

Pueden utilizarse para configuración pública como:

- URL pública de API.
- Identificadores no sensibles.
- Configuración necesaria para el cliente.

No deben contener:

- Contraseñas.
- Claves privadas.
- Tokens administrativos.
- Secretos de proveedores.
- Credenciales de base de datos.

---

## 12. XSS

El frontend debe evitar mecanismos de renderizado que interpreten contenido controlado por usuarios como HTML o JavaScript.

Debe evitarse el uso innecesario de:

- `dangerouslySetInnerHTML`.
- HTML generado directamente.
- Scripts dinámicos.
- URLs no validadas.
- Contenido externo no confiable.

Cuando sea necesario renderizar contenido HTML, debe existir una estrategia explícita de sanitización y validación.

---

## 13. URLs externas

Las URLs provenientes de usuarios o servicios externos deben validarse antes de utilizarlas en contextos sensibles.

Debe prestarse atención a:

- `href`.
- `src`.
- Redirecciones.
- Descargas.
- Imágenes.
- Recursos externos.

No debe permitirse que una entrada controlada por el usuario determine libremente destinos potencialmente peligrosos.

---

## 14. Formularios

Los formularios deben validar:

- Tipos.
- Formatos.
- Longitudes.
- Rangos.
- Campos obligatorios.
- Estados permitidos.

La validación frontend mejora la experiencia del usuario, pero el backend debe realizar nuevamente las validaciones de seguridad y negocio.

---

## 15. Datos de negocio

Los valores mostrados o calculados en frontend no deben considerarse autoritativos.

Esto es especialmente importante para:

- Precios.
- Totales.
- Descuentos.
- IVA.
- Stock.
- Cantidades.
- Estados.
- Permisos.
- Identificadores.

El backend debe validar y recalcular los valores que tengan impacto sobre la integridad del sistema.

---

## 16. Facturación

La interfaz de facturación debe evitar asumir que una acción visible puede ejecutarse simplemente porque el botón está disponible.

Las operaciones críticas deben ser autorizadas y validadas por el backend.

El frontend debe manejar correctamente:

- Estados de factura.
- Errores.
- Reintentos.
- Respuestas duplicadas.
- Operaciones no autorizadas.

---

## 17. Inventario

El frontend debe tratar los datos de inventario como información proporcionada por el backend.

No debe asumir que:

- El stock mostrado continúa disponible.
- Un precio no cambió.
- Una variante sigue activa.
- Una operación fue aplicada correctamente.

Las operaciones críticas deben confirmarse mediante la respuesta del servidor.

---

## 18. Proformas y pedidos

El frontend debe validar la entrada para facilitar el uso, pero las reglas de negocio deben permanecer en backend.

Debe considerarse especialmente:

- Medidas.
- Cantidades.
- Precios.
- Descuentos.
- Estados.
- Materiales.
- Clientes.
- Fechas.
- Relaciones entre recursos.

Una modificación directa de la solicitud HTTP no debe permitir saltarse las reglas del sistema.

---

## 19. Subida de archivos

La interfaz debe limitar los archivos antes de enviarlos para mejorar seguridad y experiencia.

Debe comprobar:

- Tipo permitido.
- Tamaño.
- Extensión.
- Cantidad.
- Estado de selección.

Estas comprobaciones no sustituyen la validación realizada por backend.

Los archivos deben enviarse únicamente a destinos autorizados.

---

## 20. Inteligencia artificial

La interfaz de IA debe considerar:

- Límites de tamaño.
- Tipos de imagen.
- Estado de procesamiento.
- Errores.
- Timeouts.
- Resultados incompletos.
- Fallos de proveedores.

No debe exponer las credenciales utilizadas por los proveedores de IA.

El navegador debe comunicarse con el backend, no directamente con servicios privados que requieran secretos.

---

## 21. Manejo de errores

Los errores recibidos del backend deben presentarse de forma controlada.

No se deben mostrar directamente:

- Stack traces.
- Consultas SQL.
- Variables de entorno.
- Rutas internas.
- Secretos.
- Detalles de infraestructura.

El mensaje mostrado al usuario debe contener únicamente la información necesaria para comprender el resultado.

---

## 22. Consola del navegador

No se deben registrar datos sensibles mediante:

```text
console.log()
console.error()
console.warn()
```

especialmente:

- Tokens.
- Contraseñas.
- Cookies.
- Claves.
- Información personal innecesaria.
- Respuestas completas de autenticación.

Los logs de diagnóstico temporales deben eliminarse antes de integrar cambios.

---

## 23. Dependencias frontend

Las dependencias deben revisarse periódicamente.

Debe considerarse:

- Vulnerabilidades conocidas.
- Versión utilizada.
- Dependencias transitivas.
- Compatibilidad.
- Cambios mayores.
- Riesgo de regresión.

Las actualizaciones deben validarse mediante lint y pruebas automatizadas.

---

## 24. Seguridad de React

El código React debe evitar patrones que faciliten ejecución o renderizado de contenido no confiable.

Debe revisarse especialmente:

- Props que terminan en HTML.
- Renderizado dinámico.
- Componentes que reciben URLs.
- Manipulación directa del DOM.
- Uso de APIs del navegador.
- Integración con scripts externos.

La abstracción de componentes no debe ocultar controles de seguridad necesarios.

---

## 25. Seguridad de Vite

La configuración de Vite debe evitar:

- Exponer secretos.
- Servir archivos sensibles.
- Configuraciones de desarrollo en producción.
- Proxies inseguros.
- Orígenes excesivamente permisivos.

La configuración de desarrollo debe distinguirse de la configuración utilizada para producción.

---

## 26. Dependencias externas del navegador

Los recursos externos deben limitarse a aquellos necesarios.

Debe evaluarse:

- Origen.
- Integridad.
- Disponibilidad.
- Privacidad.
- Necesidad funcional.
- Compatibilidad con CSP.

La inclusión de recursos externos debe revisarse cuando cambie la política de seguridad de contenido.

---

## 27. CSP y seguridad del navegador

La política CSP se configura principalmente desde el backend y la infraestructura HTTP, pero el frontend debe ser compatible con ella.

Los cambios frontend deben considerar:

- Scripts.
- Estilos.
- Imágenes.
- Fuentes.
- Conexiones.
- Recursos externos.

Un cambio que requiera relajar CSP debe justificarse y revisarse.

---

## 28. Rutas protegidas

Las rutas frontend pueden restringir la navegación visual según autenticación o rol.

Sin embargo:

```text
Ruta protegida en React
        ≠
Autorización de seguridad
```

El backend debe continuar validando todas las operaciones.

---

## 29. Gestión de estado

El estado global y las cachés de React Query no deben utilizarse como fuente definitiva para información de seguridad.

Debe evitarse conservar indefinidamente:

- Información sensible.
- Datos de otros tenants.
- Información de sesiones expiradas.
- Datos de usuarios que ya no tienen autorización.

Después de logout o cambio de usuario deben limpiarse los estados que puedan contener información del usuario anterior.

---

## 30. Multi-tenancy en frontend

El frontend debe evitar mezclar información de diferentes empresas.

La identificación del tenant debe provenir de la sesión y de la respuesta controlada por backend.

No debe permitirse que un usuario seleccione arbitrariamente una empresa para consultar datos privados simplemente modificando un parámetro de la interfaz.

El aislamiento real debe verificarse en backend.

---

## 31. Logout

El logout debe:

- Limpiar el estado de sesión.
- Eliminar datos sensibles mantenidos en memoria.
- Notificar al backend cuando corresponda.
- Evitar reutilización de información del usuario anterior.
- Redirigir a una ubicación apropiada.

La invalidación efectiva de sesiones y tokens corresponde al backend.

---

## 32. Protección contra clickjacking

La protección principal debe establecerse mediante cabeceras HTTP apropiadas.

El frontend debe evitar integraciones que requieran incrustación en orígenes no autorizados sin una justificación explícita.

---

## 33. Accesibilidad y seguridad

La accesibilidad también puede reducir errores de interacción relacionados con seguridad.

Los controles críticos deben presentar claramente:

- Estado.
- Resultado.
- Confirmación.
- Errores.
- Acciones irreversibles.

Esto es especialmente importante en operaciones de:

- Eliminación.
- Anulación.
- Facturación.
- Logout.
- Cambios de configuración.

---

## 34. Pruebas

La seguridad del frontend debe verificarse mediante:

- Lint.
- Pruebas unitarias.
- Pruebas de componentes.
- Pruebas de integración.
- Pruebas E2E.
- Pruebas manuales.
- DAST sobre la aplicación desplegada.

Los casos deben incluir:

- Usuario no autenticado.
- Usuario autenticado.
- Roles diferentes.
- Logout.
- Sesión expirada.
- Token inválido.
- Token revocado.
- Error de API.
- Entrada inválida.
- Acceso entre tenants.
- Subida de archivos.
- Formularios.

---

## 35. Estado actual

El frontend utiliza React, Vite, React Query y Axios.

La configuración actual contempla:

- API mediante `VITE_API_URL || '/api'`.
- `withCredentials`.
- Protección CSRF para solicitudes mutables.
- Access token en memoria.
- Refresh token mediante cookie `httpOnly`.
- Pruebas automatizadas.
- ESLint.

El lint frontend se encuentra actualmente sin errores, aunque existen advertencias relacionadas principalmente con reglas de React Refresh.

La cobertura global de frontend no debe interpretarse como indicador único de seguridad, ya que una cobertura baja puede coexistir con pruebas específicas de módulos críticos.

---

## 36. Criterios de aceptación

La seguridad del frontend se considera adecuadamente cubierta cuando:

- No contiene secretos.
- Las rutas visualmente protegidas también tienen protección backend.
- Los tokens se gestionan de forma segura.
- Las solicitudes mutables utilizan CSRF cuando corresponde.
- Los errores no exponen información interna.
- Las entradas se validan.
- El renderizado evita contenido no confiable.
- Los archivos son restringidos antes de enviarse.
- El estado de sesión se limpia correctamente.
- Los cambios sensibles tienen pruebas.
- Las dependencias se revisan.
- La aplicación es compatible con las políticas CSP configuradas.
- Existen pruebas E2E de autenticación y autorización.

---

## 37. Mantenimiento

Este documento debe revisarse cuando:

- Cambie React.
- Cambie Vite.
- Cambie Axios.
- Cambie la gestión de tokens.
- Cambie CSRF.
- Cambie CORS.
- Se agreguen integraciones externas.
- Se agreguen nuevos módulos.
- Cambie CSP.
- Se incorporen nuevas formas de almacenamiento local.
- Se modifique el flujo de autenticación.

Toda modificación importante del frontend debe evaluar su impacto sobre los controles de seguridad documentados.
