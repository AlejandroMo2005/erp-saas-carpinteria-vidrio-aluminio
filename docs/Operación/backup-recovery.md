# Backup y Recuperación

## 1. Propósito

Este documento establece los criterios para respaldo, recuperación y verificación de la información de la plataforma ERP/SaaS.

El objetivo es preservar la disponibilidad e integridad de los datos ante fallos de infraestructura, errores operativos, corrupción de datos, eliminación accidental o incidentes de seguridad.

---

## 2. Alcance

El proceso considera principalmente:

- MySQL.
- Redis.
- Archivos relacionados con la aplicación cuando corresponda.
- Configuración.
- Secretos.
- Evidencia de auditoría.
- Código fuente.
- Artefactos de CI/CD.

No todos estos elementos requieren el mismo mecanismo de respaldo.

---

## 3. Principio general

Un respaldo no debe considerarse válido únicamente porque el archivo de backup exista.

El proceso completo debe ser:

```text
Datos
  |
  v
Backup
  |
  v
Almacenamiento
  |
  v
Verificación
  |
  v
Prueba de restauración
  |
  v
Evidencia
```

La capacidad de restaurar debe comprobarse periódicamente.

---

## 4. Datos críticos

Los datos con mayor relevancia operativa incluyen:

- Empresas.
- Usuarios.
- Clientes.
- Materiales.
- Inventario.
- Proveedores.
- Trabajos.
- Proformas.
- Pedidos.
- Facturas.
- Detalles de facturación.
- Auditoría.
- Configuración relevante.

La prioridad de recuperación debe considerar el impacto funcional de cada conjunto de datos.

---

## 5. MySQL

MySQL constituye el almacenamiento persistente principal de la aplicación.

El respaldo debe contemplar:

- Estructura.
- Datos.
- Restricciones.
- Índices.
- Triggers.
- Procedimientos.
- Relaciones.

Cuando el objetivo sea reconstruir únicamente la estructura, puede utilizarse un respaldo de estructura sin datos.

Cuando el objetivo sea recuperar el sistema operativo, el respaldo debe incluir los datos requeridos.

---

## 6. Consistencia del backup

El backup debe producirse de manera que permita obtener una representación consistente de la base de datos.

Debe evitarse utilizar una copia incompleta como mecanismo principal de recuperación.

En bases de datos activas debe utilizarse un procedimiento apropiado para obtener una copia consistente según la herramienta y configuración utilizadas.

---

## 7. Triggers y procedimientos

La recuperación de MySQL debe considerar también los objetos adicionales definidos en la base de datos.

Actualmente se documentan:

- Triggers para actualización de totales de facturas.
- Triggers para actualización de totales de pedidos.
- Procedimientos auxiliares.

Estos objetos forman parte de la estructura de la base de datos y deben preservarse cuando el objetivo sea reconstruir el esquema completo.

---

## 8. Redis

Redis debe considerarse un almacenamiento de soporte.

Los datos almacenados temporalmente en Redis no deben asumirse automáticamente como sustituto de la información persistente de MySQL.

En particular, los mecanismos relacionados con blacklist y estado temporal deben evaluarse según su comportamiento de recuperación.

Después de una recuperación de Redis debe verificarse si las aplicaciones pueden reconstruir de forma segura el estado temporal necesario.

---

## 9. Código fuente

El código fuente se mantiene mediante control de versiones.

El repositorio debe considerarse una fuente de recuperación del código, pero no necesariamente sustituye los respaldos de:

- Base de datos.
- Secretos.
- Configuración operativa.
- Datos generados.

---

## 10. Configuración

La configuración necesaria para recuperar la aplicación debe estar identificada.

Puede incluir:

- Variables de entorno.
- Configuración de MySQL.
- Configuración de Redis.
- Configuración del backend.
- Configuración del frontend.
- Configuración de proveedores externos.
- Configuración de CI/CD.

Los secretos no deben almacenarse directamente en el repositorio.

---

## 11. Secretos

Los secretos deben gestionarse separadamente del código fuente.

Entre ellos pueden existir:

- Credenciales de base de datos.
- Credenciales de Redis.
- Secretos JWT.
- Claves de proveedores.
- Credenciales de servicios externos.
- Credenciales de facturación.

Un backup que contenga secretos debe recibir controles de acceso equivalentes a la sensibilidad de esos datos.

---

## 12. Almacenamiento de backups

Los respaldos deben almacenarse en una ubicación diferente de la instancia principal cuando sea posible.

Debe evitarse depender exclusivamente de:

```text
Servidor
   |
   +--> Datos
   |
   +--> Backup
```

porque la pérdida del servidor podría afectar simultáneamente ambos.

El almacenamiento definitivo debe definirse según la infraestructura de despliegue seleccionada.

---

## 13. Retención

La política de retención debe definir:

- Frecuencia.
- Número de copias.
- Antigüedad máxima.
- Eliminación.
- Copias históricas.
- Copias previas a cambios críticos.

Los periodos concretos deben establecerse según los requisitos operativos y no inventarse como valores arbitrarios.

---

## 14. Backups previos a cambios críticos

Debe considerarse un respaldo antes de:

- Migraciones de base de datos.
- Cambios estructurales.
- Eliminación masiva de datos.
- Cambios importantes de arquitectura.
- Cambios de facturación.
- Operaciones administrativas de alto impacto.

El respaldo previo no sustituye las pruebas en un entorno seguro.

---

## 15. Restauración

El proceso conceptual es:

```text
Identificar incidente
       |
       v
Determinar punto de recuperación
       |
       v
Seleccionar backup
       |
       v
Preparar entorno
       |
       v
Restaurar
       |
       v
Verificar integridad
       |
       v
Verificar aplicación
       |
       v
Registrar resultado
```

---

## 16. Restauración de MySQL

La restauración debe realizarse preferentemente sobre un entorno controlado antes de reemplazar la instancia operativa.

Debe verificarse:

- Conexión.
- Tablas.
- Índices.
- Foreign keys.
- Triggers.
- Procedimientos.
- Datos.
- Estados.
- Relaciones.

---

## 17. Verificación posterior a la restauración

Después de restaurar deben comprobarse como mínimo:

```text
Base de datos
    |
    +--> Conexión
    +--> Tablas
    +--> Relaciones
    +--> Índices
    +--> Triggers
    +--> Procedimientos
    +--> Datos
```

Posteriormente:

```text
Aplicación
    |
    +--> Login
    +--> Clientes
    +--> Materiales
    +--> Inventario
    +--> Proformas
    +--> Pedidos
    +--> Facturación
```

Los casos exactos deben adaptarse al alcance del incidente.

---

## 18. Integridad de datos

La recuperación no debe evaluarse únicamente mediante la disponibilidad de la aplicación.

Debe comprobarse que:

- Las relaciones sean válidas.
- Los registros esperados existan.
- Los identificadores sean coherentes.
- Los totales permanezcan consistentes.
- Los estados sean válidos.
- El aislamiento empresarial continúe funcionando.

---

## 19. Recuperación multi-tenant

Después de una restauración debe verificarse especialmente el aislamiento entre empresas.

Debe comprobarse que:

```text
Empresa A
   |
   +--> Datos A
```

y:

```text
Empresa B
   |
   +--> Datos B
```

continúen correctamente separados.

Una restauración que permita acceso cruzado entre empresas debe considerarse un fallo crítico.

---

## 20. Recuperación de sesiones

Las sesiones y tokens requieren tratamiento específico.

Después de una recuperación puede ser necesario:

- Invalidar sesiones.
- Revocar tokens.
- Reconstruir estado temporal.
- Solicitar nueva autenticación.

La decisión debe depender del tipo de incidente y de la información recuperada.

---

## 21. Recuperación después de compromiso de seguridad

Si existe sospecha de compromiso, restaurar datos no es suficiente.

Debe evaluarse:

```text
Incidente
   |
   v
Contención
   |
   v
Revocación
   |
   v
Rotación de secretos
   |
   v
Recuperación
   |
   v
Verificación
```

No debe restaurarse un entorno comprometido sin analizar primero la causa del incidente.

---

## 22. Recuperación de secretos

Cuando un secreto pueda haber sido expuesto:

1. Revocarlo.
2. Generar uno nuevo.
3. Actualizar la configuración.
4. Verificar servicios dependientes.
5. Revisar logs y artefactos.
6. Registrar el incidente cuando corresponda.

El backup histórico no debe convertirse en una fuente permanente de credenciales activas.

---

## 23. Recuperación de archivos

Los archivos generados o cargados por la aplicación deben incluirse en el mecanismo de respaldo si son necesarios para la operación.

Debe identificarse:

- Ubicación.
- Propietario.
- Relación con registros.
- Integridad.
- Tamaño.
- Política de retención.

Los archivos de proveedores externos que puedan regenerarse no necesariamente requieren el mismo tratamiento que datos empresariales originales.

---

## 24. RPO

El Recovery Point Objective representa la cantidad máxima de información que puede perderse temporalmente después de un incidente.

El RPO debe definirse según:

- Frecuencia de cambios.
- Criticidad del dato.
- Capacidad de respaldo.
- Coste operativo.

No se establece un valor numérico definitivo hasta disponer de requisitos operativos y arquitectura de producción.

---

## 25. RTO

El Recovery Time Objective representa el tiempo objetivo para recuperar la operación.

Debe considerar:

- Restauración de MySQL.
- Configuración.
- Aplicación.
- Redis.
- Integraciones externas.
- Verificación.

El valor definitivo debe establecerse después de medir un proceso de recuperación real.

---

## 26. Pruebas de restauración

Una copia que nunca se ha restaurado debe considerarse no verificada.

Las pruebas deben incluir:

- Restauración de estructura.
- Restauración de datos.
- Verificación de relaciones.
- Verificación de aplicación.
- Verificación de autenticación.
- Verificación de operaciones críticas.

---

## 27. Evidencia

Cada prueba de recuperación debe registrar:

- Fecha.
- Backup utilizado.
- Punto de recuperación.
- Entorno.
- Resultado.
- Errores.
- Tiempo empleado.
- Validaciones realizadas.
- Acciones correctivas.

La evidencia debe permitir determinar si el procedimiento realmente funciona.

---

## 28. Monitoreo de backups

Cuando exista infraestructura operativa, debe verificarse:

- Ejecución.
- Éxito.
- Tamaño.
- Antigüedad.
- Disponibilidad.
- Integridad.
- Fallos.

Un backup fallido debe generar una acción de seguimiento.

---

## 29. Seguridad de backups

Los backups deben protegerse mediante controles apropiados para:

- Acceso.
- Cifrado cuando corresponda.
- Integridad.
- Retención.
- Eliminación segura.
- Auditoría.

Los permisos deben seguir el principio de mínimo privilegio.

---

## 30. Eliminación de backups

La eliminación de copias debe seguir la política de retención definida.

Debe evitarse eliminar todas las copias históricas como consecuencia de una operación manual no controlada.

Las copias que puedan ser necesarias para investigación de incidentes deben conservarse según la política correspondiente.

---

## 31. Escenarios de recuperación

Deben considerarse al menos:

| Escenario | Acción principal |
|---|---|
| Error operativo | Restauración selectiva o corrección |
| Eliminación accidental | Recuperación desde backup |
| Corrupción de datos | Restauración y validación |
| Fallo de servidor | Reconstrucción y restauración |
| Pérdida de Redis | Reconstrucción del estado temporal |
| Compromiso de credenciales | Revocación y rotación |
| Incidente de seguridad | Contención, investigación y recuperación |

La acción definitiva depende del incidente real.

---

## 32. Criterios de recuperación exitosa

La recuperación puede considerarse exitosa cuando:

- La base de datos está disponible.
- Las relaciones son consistentes.
- Los datos requeridos fueron recuperados.
- La aplicación puede iniciar.
- La autenticación funciona.
- El aislamiento multi-tenant funciona.
- Los flujos críticos funcionan.
- Los errores conocidos fueron evaluados.
- La evidencia quedó registrada.

---

## 33. Criterios de fallo

La recuperación debe considerarse fallida cuando:

- El backup no puede restaurarse.
- Existen datos corruptos.
- Las relaciones no son válidas.
- La aplicación no puede operar.
- Se pierde aislamiento entre empresas.
- Se producen errores críticos en flujos principales.
- No puede determinarse qué datos fueron recuperados.

El procedimiento debe detenerse o pasar a un plan alternativo según el escenario.

---

## 34. Relación con incidentes

La recuperación forma parte del ciclo de respuesta a incidentes:

```text
Detección
   |
   v
Contención
   |
   v
Investigación
   |
   v
Erradicación
   |
   v
Recuperación
   |
   v
Verificación
   |
   v
Lecciones aprendidas
```

Este proceso se relaciona con `docs/Seguridad/respuesta-incidentes.md`.

---

## 35. Estado actual

La base de datos dispone de una estructura documentada y puede respaldarse mediante herramientas de MySQL.

No se establece en este documento una frecuencia definitiva de backups, un proveedor de almacenamiento concreto ni objetivos numéricos de RPO/RTO porque todavía deben definirse junto con la infraestructura operativa.

La estrategia de recuperación debe validarse mediante pruebas reales antes de considerarse operativamente establecida.

---

## 36. Mantenimiento

Este documento debe actualizarse cuando:

- Se defina la infraestructura de producción.
- Se establezca una política de backups.
- Se definan RPO/RTO.
- Se incorpore almacenamiento externo.
- Cambie la arquitectura de datos.
- Se agreguen archivos persistentes.
- Se modifique el mecanismo de sesiones.
- Se realicen pruebas de restauración.

Cada cambio debe conservar evidencia suficiente para demostrar la capacidad real de recuperación.
