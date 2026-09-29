# Estrategia de Rendimiento

## 1. Propósito

Este documento establece la estrategia para evaluar el rendimiento de la plataforma ERP/SaaS.

El objetivo es medir y controlar el comportamiento del frontend, backend, base de datos, Redis y flujos críticos bajo condiciones representativas de uso.

---

## 2. Alcance

La estrategia contempla:

- Frontend React/Vite.
- API Node/Express.
- MySQL.
- Redis.
- PM2.
- Consultas de base de datos.
- API.
- Renderizado.
- Carga de recursos.
- Operaciones de inventario.
- Proformas.
- Pedidos.
- Facturación.
- Autenticación.
- Servicios de IA.
- Concurrencia.
- Consumo de CPU y memoria.

---

## 3. Objetivos

Las pruebas de rendimiento deben permitir:

1. Identificar cuellos de botella.
2. Medir tiempos de respuesta.
3. Evaluar consumo de recursos.
4. Detectar consultas costosas.
5. Evaluar comportamiento concurrente.
6. Identificar degradación bajo carga.
7. Verificar estabilidad de procesos.
8. Establecer una línea base.
9. Comparar cambios entre versiones.
10. Generar evidencia reproducible.

---

## 4. Principio de medición

El rendimiento debe medirse mediante datos observables y reproducibles.

No debe considerarse suficiente afirmar que una operación es "rápida" o "lenta".

Cada medición relevante debe indicar:

- Entorno.
- Versión.
- Fecha.
- Carga.
- Número de usuarios o solicitudes.
- Duración.
- Percentiles.
- Errores.
- Recursos utilizados.

---

## 5. Niveles de rendimiento

La estrategia se divide en:

| Nivel | Objetivo |
|---|---|
| Frontend | Medir experiencia de carga e interacción |
| API | Medir latencia y throughput |
| Base de datos | Identificar consultas costosas |
| Redis | Medir operaciones dependientes de caché/sesión |
| Integración | Evaluar interacción entre componentes |
| Carga | Evaluar comportamiento con concurrencia |
| Estrés | Identificar límites del sistema |
| Resistencia | Detectar degradación prolongada |

---

## 6. Línea base

Antes de optimizar debe establecerse una línea base.

La línea base debe registrar al menos:

- Tiempo de respuesta API.
- Percentil p50.
- Percentil p95.
- Percentil p99 cuando el volumen permita calcularlo.
- Tasa de errores.
- Requests por segundo.
- CPU.
- Memoria.
- Conexiones a MySQL.
- Uso de Redis.
- Métricas frontend relevantes.

Sin una línea base no debe afirmarse que una optimización produjo una mejora.

---

## 7. Entorno

Las mediciones deben indicar el entorno donde fueron obtenidas.

Debe registrarse:

- CPU.
- RAM.
- Sistema operativo.
- Node.js.
- MySQL.
- Redis.
- Navegador cuando corresponda.
- Versión del proyecto.
- Configuración PM2.
- Variables relevantes.

Las mediciones realizadas en Codespaces no deben presentarse automáticamente como equivalentes a producción.

---

## 8. Frontend

El rendimiento frontend debe evaluarse mediante:

- LCP.
- CLS.
- INP.
- Tiempo de carga.
- Tamaño de recursos.
- JavaScript transferido.
- Imágenes.
- Solicitudes.
- Renderizado.

También debe analizarse el impacto de:

- React Query.
- Lazy loading.
- Componentes grandes.
- Imágenes.
- Formularios.
- Visualización de IA.

---

## 9. Métricas Web

Las métricas principales son:

### LCP

Mide el tiempo hasta que aparece el contenido principal.

### CLS

Mide la estabilidad visual.

### INP

Mide la capacidad de respuesta ante interacciones.

Estas métricas deben analizarse junto con otras métricas de carga y no de forma aislada.

---

## 10. Línea base frontend existente

Una ejecución de Lighthouse registrada durante el proceso de calidad obtuvo:

- Performance: 98.
- Accessibility: 100.
- Best Practices: 100.
- SEO: 100.
- LCP: 2.45 s.
- CLS: 0.
- INP: 56 ms.

Estos valores corresponden a una medición concreta y no deben interpretarse como garantía permanente del rendimiento.

Las mediciones posteriores deben indicar su propio entorno y condiciones.

---

## 11. API

Las pruebas de API deben medir:

- Latencia.
- Throughput.
- Errores.
- Percentiles.
- Concurrencia.
- Tamaño de respuesta.

Las rutas críticas deben medirse por separado para evitar que una ruta rápida o poco utilizada distorsione el resultado general.

---

## 12. Endpoints prioritarios

Deben priorizarse endpoints relacionados con:

- Login.
- Sesiones.
- Clientes.
- Materiales.
- Inventario.
- Proformas.
- Pedidos.
- Facturación.
- Dashboard.
- Búsquedas.
- IA.

La selección definitiva debe basarse en frecuencia de uso y costo operativo.

---

## 13. Percentiles

Las mediciones deben utilizar percentiles además del promedio.

Como referencia:

```text
p50 → comportamiento típico
p95 → comportamiento de la mayoría de solicitudes
p99 → comportamiento de las solicitudes más lentas
```

El promedio puede ocultar colas de latencia y no debe utilizarse como única métrica.

---

## 14. Throughput

Debe medirse la cantidad de operaciones procesadas durante un intervalo.

Por ejemplo:

```text
Requests/segundo
Requests/minuto
Operaciones concurrentes
```

La métrica debe acompañarse de:

- Tasa de errores.
- Latencia.
- Recursos utilizados.

Un throughput alto con errores elevados no representa una mejora funcional.

---

## 15. Concurrencia

Los escenarios de concurrencia deben evaluar operaciones simultáneas.

Especialmente:

- Login.
- Consultas.
- Inventario.
- Proformas.
- Pedidos.
- Facturación.
- Secuencias.
- Operaciones de IA.

Debe verificarse que la concurrencia no provoque inconsistencias.

---

## 16. Pruebas de carga

Una prueba de carga debe utilizar una carga objetivo definida previamente.

Debe registrar:

```text
Usuarios concurrentes
        ↓
Solicitudes
        ↓
Latencia
        ↓
Errores
        ↓
Recursos
```

La carga debe incrementarse progresivamente para observar el comportamiento del sistema.

---

## 17. Pruebas de estrés

Las pruebas de estrés buscan identificar el comportamiento cuando se supera la carga objetivo.

Deben observarse:

- Punto de degradación.
- Aumento de latencia.
- Errores.
- Saturación.
- Recuperación.

El objetivo no es únicamente obtener un número máximo, sino conocer cómo responde el sistema ante sobrecarga.

---

## 18. Pruebas de resistencia

Las pruebas de resistencia mantienen una carga sostenida durante un periodo prolongado.

Permiten detectar:

- Fugas de memoria.
- Acumulación de conexiones.
- Crecimiento de logs.
- Degradación progresiva.
- Problemas de Redis.
- Problemas de MySQL.
- Procesos inestables.

---

## 19. Node.js

El backend debe observar:

- CPU.
- Memoria.
- Event loop.
- Número de procesos.
- Reinicios.
- Tiempo de respuesta.

Un aumento progresivo de memoria debe investigarse antes de aumentar únicamente los límites del proceso.

---

## 20. PM2

El backend utiliza PM2 para la gestión del proceso.

La configuración contempla:

```text
max_memory_restart = 400M
```

Este límite constituye un mecanismo operativo ante consumo elevado de memoria.

No debe considerarse una solución para fugas de memoria.

Los reinicios provocados por alcanzar el límite deben registrarse y analizarse.

---

## 21. MySQL

El rendimiento de MySQL debe evaluarse mediante:

- Tiempo de consultas.
- Índices.
- Filas examinadas.
- Joins.
- Ordenamientos.
- Agrupaciones.
- Conexiones.
- Locks.
- Transacciones.

Las consultas críticas deben analizarse con herramientas como `EXPLAIN` cuando sea necesario.

---

## 22. Índices

Los índices deben evaluarse según:

- Consultas reales.
- Columnas utilizadas en filtros.
- Relaciones.
- Ordenamientos.
- Unicidad.
- Cardinalidad.

No deben agregarse índices únicamente porque una columna aparezca frecuentemente en una consulta.

También debe considerarse el costo de escritura y mantenimiento.

---

## 23. Pool de conexiones

El backend utiliza un pool de conexiones MySQL configurado con un máximo de 10 conexiones en el contexto actual.

Este valor debe evaluarse mediante mediciones reales.

Debe observarse:

- Conexiones activas.
- Espera por conexión.
- Tiempo de consulta.
- Errores.
- Saturación.

El tamaño óptimo depende de la carga y del entorno de despliegue.

---

## 24. Redis

Las operaciones Redis deben evaluarse considerando:

- Latencia.
- Throughput.
- Memoria.
- Expiración.
- Conexiones.
- Errores.

Los flujos de autenticación, blacklist y sesiones deben comprobar que el uso de Redis no se convierta en un cuello de botella.

---

## 25. Consultas críticas

Deben priorizarse consultas asociadas con:

- Dashboard.
- Listados.
- Búsquedas.
- Inventario.
- Proformas.
- Pedidos.
- Facturas.
- Clientes.

Debe analizarse especialmente cualquier consulta que combine:

- Muchos joins.
- Ordenamientos.
- Agregaciones.
- Filtros dinámicos.
- Grandes conjuntos de resultados.

---

## 26. Paginación

Los listados grandes deben utilizar mecanismos de paginación cuando corresponda.

Debe evitarse devolver cantidades innecesarias de registros.

La evaluación debe considerar:

- Tamaño de página.
- Latencia.
- Número de filas.
- Memoria.
- Tiempo de renderizado.

---

## 27. Payloads

El tamaño de las solicitudes y respuestas influye directamente en:

- Transferencia.
- Memoria.
- Parsing.
- Renderizado.
- Latencia.

Los endpoints deben evitar devolver campos innecesarios.

Las operaciones con archivos o imágenes deben tener límites apropiados.

---

## 28. IA

Las operaciones de IA deben evaluarse por separado porque dependen de servicios externos.

Las métricas relevantes incluyen:

- Tiempo total.
- Tiempo de proveedor.
- Timeout.
- Tasa de error.
- Tasa de éxito.
- Tamaño de entrada.
- Tamaño de salida.
- Consumo de recursos.

Los resultados no deben compararse directamente con endpoints CRUD tradicionales.

---

## 29. Caché

Cuando se utilice caché, debe medirse:

- Hit rate.
- Miss rate.
- Latencia.
- Invalidación.
- Consistencia.

No debe introducirse caché para ocultar una consulta incorrecta o un diseño de persistencia ineficiente.

---

## 30. Rendimiento de autenticación

Login y refresh deben evaluarse por separado debido a su interacción con:

- Hash de contraseñas.
- JWT.
- Redis.
- MySQL.
- Sesiones.
- Auditoría.

El objetivo no es minimizar indiscriminadamente el costo criptográfico, sino mantener un equilibrio entre seguridad y rendimiento.

---

## 31. Rendimiento de facturación

Las operaciones de facturación deben evaluarse considerando:

- Cabecera.
- Detalles.
- Totales.
- Triggers.
- Secuencias.
- Transacciones.
- Integraciones externas.

Debe medirse tanto la operación individual como el comportamiento bajo concurrencia cuando corresponda.

---

## 32. Rendimiento de inventario

El inventario requiere especial atención debido a posibles operaciones concurrentes.

Deben evaluarse:

- Lectura de stock.
- Actualización.
- Reservas cuando correspondan.
- Consultas de disponibilidad.
- Concurrencia.

El rendimiento no debe evaluarse separadamente de la integridad de los datos.

---

## 33. Rendimiento de proformas y pedidos

Los flujos de proformas y pedidos deben medir:

- Tiempo de creación.
- Tiempo de consulta.
- Procesamiento de detalles.
- Cálculo de totales.
- Persistencia.
- Conversión entre entidades cuando corresponda.

Los resultados deben asociarse con el volumen de datos utilizado.

---

## 34. Pruebas de regresión de rendimiento

Después de cambios importantes deben compararse los resultados con la línea base.

Una regresión debe identificarse mediante diferencias medibles en:

- Latencia.
- Throughput.
- Errores.
- CPU.
- Memoria.
- Consultas.

No debe considerarse regresión cualquier variación mínima causada por ruido del entorno.

---

## 35. Criterios de comparación

Las comparaciones deben realizarse bajo condiciones similares.

Debe mantenerse constante, cuando sea posible:

- Dataset.
- Configuración.
- Hardware.
- Número de usuarios.
- Duración.
- Versión de dependencias.
- Configuración del navegador.

Si cambia el entorno, debe indicarse explícitamente.

---

## 36. Automatización

Las pruebas de rendimiento deben automatizarse progresivamente.

El pipeline puede incorporar:

- Smoke de rendimiento.
- Pruebas API.
- Pruebas de carga.
- Comparación contra línea base.
- Reportes.

Las pruebas de carga pesadas no deben ejecutarse indiscriminadamente en cada commit si generan costos o inestabilidad innecesarios.

---

## 37. Umbrales

Los umbrales deben definirse a partir de:

- Requisitos funcionales.
- Expectativas de usuario.
- Capacidad de infraestructura.
- Línea base.
- Resultados históricos.

No deben inventarse umbrales sin evidencia.

Cuando todavía no exista una línea base suficiente, el resultado debe marcarse como pendiente de establecer.

---

## 38. Herramientas

La selección de herramientas debe depender del objetivo.

Pueden utilizarse:

- Lighthouse.
- Chrome DevTools.
- Playwright.
- Herramientas de carga HTTP.
- Herramientas de análisis MySQL.
- PM2.
- Métricas del sistema.
- Logs.

La herramienta utilizada debe quedar registrada junto con las condiciones de medición.

---

## 39. Evidencia

Cada prueba relevante debe conservar:

- Fecha.
- Commit o versión.
- Entorno.
- Configuración.
- Dataset.
- Carga.
- Duración.
- Latencia.
- Percentiles.
- Errores.
- CPU.
- Memoria.
- Resultado.

Los resultados deben permitir repetir la medición.

---

## 40. Estado actual

Existe una medición frontend de Lighthouse con Performance 98, Accessibility 100, Best Practices 100 y SEO 100, además de LCP de 2.45 s, CLS de 0 e INP de 56 ms.

El backend dispone de PM2 y un pool MySQL de hasta 10 conexiones en la configuración actual.

Las pruebas formales de carga, estrés y resistencia deben ejecutarse en un entorno controlado y sus resultados deben registrarse antes de establecer conclusiones de capacidad.

---

## 41. Criterios de aceptación

La estrategia de rendimiento se considera cubierta cuando:

- Existe una línea base reproducible.
- Las métricas frontend están registradas.
- Los endpoints críticos tienen mediciones.
- Las consultas críticas han sido analizadas.
- MySQL y Redis tienen métricas relevantes.
- Existen pruebas de concurrencia para operaciones críticas.
- Se han evaluado carga y estrés.
- Se ha evaluado resistencia cuando sea necesario.
- CPU y memoria son observadas.
- Los resultados se comparan entre versiones.
- Las regresiones relevantes pueden detectarse.
- Los resultados cuentan con evidencia.

---

## 42. Mantenimiento

La estrategia debe actualizarse cuando:

- Cambie la arquitectura.
- Cambie MySQL.
- Cambie Redis.
- Cambie PM2.
- Se agreguen módulos.
- Se modifiquen consultas.
- Se incorporen nuevos proveedores de IA.
- Se modifique infraestructura.
- Se incorporen pruebas de carga.
- Se establezcan nuevos umbrales.

Toda optimización significativa debe estar respaldada por una medición antes y después cuando sea técnicamente posible.
