# Migración de Arquitectura Legacy

## 1. Propósito

Este documento establece el enfoque para identificar, migrar, verificar y retirar componentes de la arquitectura legacy de la plataforma ERP/SaaS.

El objetivo es reducir duplicación, evitar mantener dos arquitecturas funcionalmente equivalentes y consolidar las responsabilidades en la estructura modular vigente.

---

## 2. Contexto

El proyecto evolucionó desde una estructura anterior basada principalmente en directorios globales hacia una arquitectura modular bajo:

```text
backend/src/modules/
backend/src/shared/
```

Durante la transición permanecieron componentes de la estructura anterior.

Esta situación genera riesgos de:

- Duplicación.
- Ambigüedad arquitectónica.
- Mantenimiento de código no utilizado.
- Cambios aplicados al componente incorrecto.
- Resultados duplicados en análisis estático.
- Mayor superficie de pruebas.
- Mayor complejidad de incorporación de cambios.

---

## 3. Arquitectura objetivo

La estructura objetivo se organiza conceptualmente como:

```text
backend/
└── src/
    ├── config/
    ├── modules/
    │   ├── auth/
    │   ├── clientes/
    │   ├── materiales/
    │   ├── pedidos/
    │   ├── proformas/
    │   ├── facturacion/
    │   └── ...
    └── shared/
        ├── middleware/
        ├── services/
        ├── utils/
        └── ...
```

La estructura exacta debe corresponder al estado real del repositorio.

---

## 4. Principio de migración

La migración debe realizarse de forma incremental:

```text
Identificar
    ↓
Analizar consumidores
    ↓
Determinar reemplazo
    ↓
Migrar referencias
    ↓
Ejecutar pruebas
    ↓
Verificar ausencia de dependencias
    ↓
Eliminar legacy
    ↓
Ejecutar pruebas nuevamente
    ↓
Analizar calidad
```

No debe eliminarse un archivo únicamente porque parezca duplicado.

---

## 5. Criterios para identificar legacy

Un componente puede considerarse candidato a migración cuando:

- Pertenece a la estructura anterior.
- Existe un reemplazo funcional en `src/`.
- No es requerido directamente por el runtime.
- Mantiene lógica duplicada.
- Es utilizado únicamente por otros componentes legacy.
- Aparece como duplicación en análisis estático.
- No posee consumidores válidos.

La clasificación debe verificarse mediante referencias reales.

---

## 6. Inventario de legacy

El inventario debe considerar al menos:

```text
controllers/
models/
routes/
middleware/
services/
config/
utils/
```

También deben revisarse archivos duplicados o equivalentes fuera de estas categorías.

El inventario debe actualizarse durante la migración.

---

## 7. Ejemplos de duplicación identificada

El análisis estático previo mostró duplicaciones entre componentes legacy y componentes de la arquitectura actual.

Entre las áreas identificadas se encuentran:

- Dashboard.
- Proveedores.
- Facturación.
- Autenticación.
- Configuración.
- Servicios de IA.
- Cálculo de proformas.
- Servicios de comprobantes.
- Servicios PDF.
- Middleware de tenant.
- Logger.
- Rutas.
- Validadores.
- Modelos y repositorios.

Estos resultados deben utilizarse como inventario técnico y no como prueba automática de que todos los archivos legacy pueden eliminarse.

---

## 8. Estrategia por módulo

Cada migración debe tratarse por dominio funcional.

Ejemplo:

```text
Módulo proveedores

Legacy
   |
   +--> controller
   +--> model
   +--> route
   |
   v
Arquitectura actual
   |
   +--> module
   +--> repository
   +--> controller / handler
   +--> routes
   |
   v
Pruebas
   |
   v
Eliminación legacy
```

La misma estrategia puede aplicarse progresivamente a otros módulos.

---

## 9. Análisis de consumidores

Antes de eliminar un componente deben buscarse referencias desde:

- Imports.
- Requires.
- Routes.
- Controllers.
- Services.
- Tests.
- Jobs.
- Scripts.
- Configuración.
- Server startup.
- CI/CD.
- Documentación operativa cuando corresponda.

La búsqueda debe abarcar todo el repositorio relevante.

---

## 10. Dependencias indirectas

Debe verificarse también el uso indirecto.

Un archivo puede no ser importado directamente por una ruta, pero puede participar mediante:

- Registro dinámico.
- Configuración.
- Inicialización.
- Middleware.
- Barrel files.
- Scripts.
- Carga automática.
- Tests.

La ausencia de un import directo no demuestra por sí sola que sea seguro eliminarlo.

---

## 11. Migración de rutas

Las rutas deben migrarse hacia la estructura modular vigente.

El flujo esperado es:

```text
Ruta legacy
   |
   v
Identificar endpoint
   |
   v
Localizar equivalente modular
   |
   v
Actualizar imports
   |
   v
Ejecutar pruebas API
   |
   v
Eliminar ruta legacy
```

Debe comprobarse que no queden dos rutas activas para el mismo propósito sin una justificación explícita.

---

## 12. Migración de controladores

Para cada controlador legacy debe determinarse:

1. Qué endpoints utiliza.
2. Qué lógica contiene.
3. Qué dependencias utiliza.
4. Qué componente modular lo reemplaza.
5. Qué pruebas cubren su comportamiento.
6. Qué consumidores deben migrarse.

La eliminación debe ocurrir después de verificar el reemplazo.

---

## 13. Migración de modelos

Los modelos legacy deben revisarse especialmente porque pueden contener:

- Consultas SQL.
- Reglas de persistencia.
- Relaciones.
- Transformaciones.
- Validaciones.

Antes de eliminar un modelo debe comprobarse que la funcionalidad equivalente exista en los repositorios actuales.

---

## 14. Migración de servicios

Los servicios duplicados deben compararse funcionalmente.

No debe asumirse que dos archivos con nombres similares son equivalentes.

Debe compararse:

- Entradas.
- Salidas.
- Errores.
- Dependencias.
- Transacciones.
- Efectos secundarios.
- Logging.
- Auditoría.
- Manejo multi-tenant.

---

## 15. Migración de middleware

Los middleware legacy deben analizarse considerando su posición dentro de la cadena HTTP.

Especial atención requiere:

- Autenticación.
- Autorización.
- Tenant.
- CSRF.
- Rate limiting.
- Validación.
- Manejo de errores.

Un middleware aparentemente duplicado puede tener diferencias funcionales importantes.

---

## 16. Migración de configuración

La configuración debe consolidarse en los puntos definidos por la arquitectura actual.

El proyecto cuenta con una configuración canónica de base de datos bajo:

```text
backend/src/config/database.js
```

La existencia de una configuración anterior debe verificarse antes de eliminarla.

---

## 17. Migración de logger

El logger canónico actual se encuentra bajo:

```text
backend/src/shared/utils/logger.js
```

Existe un componente de compatibilidad en:

```text
backend/utils/logger.js
```

La compatibilidad debe mantenerse mientras existan consumidores válidos.

Su eliminación requiere:

1. Migrar consumidores.
2. Ejecutar pruebas.
3. Verificar imports restantes.
4. Confirmar ausencia de uso runtime.
5. Eliminar el archivo.
6. Ejecutar nuevamente lint y pruebas.

---

## 18. Migración de servicios compartidos

Los servicios que tengan alcance transversal deben ubicarse en `src/shared` cuando su responsabilidad sea realmente compartida.

No debe utilizarse `shared` como destino indiscriminado para cualquier código.

La ubicación debe responder a la responsabilidad arquitectónica real.

---

## 19. Migración de IA

Los servicios relacionados con IA deben revisarse para evitar mantener implementaciones duplicadas.

Debe comprobarse:

- Proveedor.
- Fallback.
- Validación.
- Manejo de errores.
- Timeout.
- Persistencia.
- Logging.
- Compatibilidad con los controladores actuales.

El comportamiento ante errores de proveedor debe conservarse durante la migración.

---

## 20. Migración de facturación

Facturación debe tratarse como un dominio sensible.

La migración debe verificar:

- Estados.
- Totales.
- Detalles.
- Secuencias.
- Integridad.
- Autorización.
- Auditoría.
- Integración externa.

No debe eliminarse una implementación legacy hasta demostrar que el reemplazo conserva el comportamiento requerido.

---

## 21. Migración de proformas

La migración de componentes relacionados con proformas debe verificar:

- Cálculos.
- Medidas.
- Materiales.
- Cantidades.
- Precios.
- Cliente.
- Empresa.
- Persistencia.

Las pruebas de cálculo deben ejecutarse antes y después de la migración.

---

## 22. Migración de inventario

La migración de inventario debe verificar:

- Stock.
- Stock mínimo.
- Material.
- Empresa.
- Variantes.
- Actualizaciones concurrentes.
- Persistencia.

Los cambios que puedan afectar cantidades deben evaluarse con especial cuidado.

---

## 23. Migración de pruebas

Las pruebas no deben permanecer apuntando indefinidamente a la arquitectura legacy.

Para cada migración:

```text
Prueba legacy
     |
     v
Identificar comportamiento
     |
     v
Actualizar import / dependencia
     |
     v
Prueba sobre arquitectura actual
```

Las pruebas deben conservar el comportamiento que realmente se pretende validar.

---

## 24. Orden recomendado

La migración puede organizarse en este orden general:

```text
1. Componentes sin consumidores
2. Utilidades duplicadas
3. Middleware
4. Configuración
5. Servicios
6. Modelos
7. Controladores
8. Rutas
9. Componentes residuales
```

El orden concreto debe depender de las dependencias reales detectadas.

---

## 25. Verificación antes de eliminar

Antes de eliminar un componente deben comprobarse:

- Referencias en código.
- Referencias en pruebas.
- Referencias en configuración.
- Referencias en scripts.
- Imports dinámicos conocidos.
- Uso durante startup.
- Uso durante CI/CD.

Después debe ejecutarse el conjunto de pruebas correspondiente.

---

## 26. Verificación después de eliminar

Después de eliminar un componente deben ejecutarse, según el alcance:

```text
Lint
  ↓
Unit tests
  ↓
Integration tests
  ↓
E2E
  ↓
Análisis estático
```

No todos los niveles son obligatorios para cada archivo, pero los cambios de alto impacto deben recibir una verificación proporcional.

---

## 27. Uso de SonarCloud

SonarCloud se utiliza como una fuente de información para detectar:

- Duplicación.
- Reliability issues.
- Security issues.
- Maintainability issues.
- Componentes potencialmente redundantes.

Los resultados deben interpretarse junto con el análisis del repositorio.

Un issue de duplicación no significa automáticamente que uno de los archivos deba eliminarse.

---

## 28. Objetivo de reducción de duplicación

La reducción de duplicación debe lograrse mediante consolidación arquitectónica.

No debe realizarse mediante:

- Eliminaciones indiscriminadas.
- Exclusiones artificiales.
- Supresión masiva de reglas.
- Ocultamiento de archivos.
- Modificación de umbrales para evitar hallazgos.

La meta es reducir la causa estructural de la duplicación.

---

## 29. Compatibilidad temporal

Los componentes de compatibilidad pueden mantenerse temporalmente cuando:

- Existan consumidores activos.
- La migración sea incremental.
- El reemplazo todavía esté en verificación.

Deben considerarse deuda técnica y retirarse cuando ya no sean necesarios.

---

## 30. Criterios de finalización

Una migración de módulo puede considerarse completada cuando:

- El código principal utiliza la arquitectura actual.
- Los consumidores legacy fueron migrados.
- Las pruebas relevantes pasan.
- No existen referencias válidas al componente retirado.
- El componente legacy fue eliminado.
- La documentación fue actualizada.
- El análisis de calidad no revela una nueva duplicación equivalente.

---

## 31. Criterios de rollback

Debe poder revertirse una migración cuando:

- Aparezca una regresión crítica.
- Se detecte pérdida de funcionalidad.
- Se detecte corrupción de datos.
- Se rompa un flujo crítico.
- Se comprometa el aislamiento multi-tenant.
- Se introduzca una vulnerabilidad.

La estrategia de rollback debe corresponder al mecanismo de control de versiones y despliegue disponible.

---

## 32. Evidencia de migración

Cada migración relevante debe conservar evidencia de:

- Archivos modificados.
- Componentes eliminados.
- Referencias migradas.
- Pruebas ejecutadas.
- Resultados de CI.
- Análisis estático cuando corresponda.
- Cambios arquitectónicos.
- Decisiones técnicas.

La evidencia debe permitir reconstruir por qué el cambio fue considerado seguro.

---

## 33. Estado actual

La arquitectura modular bajo `backend/src/modules` y `backend/src/shared` constituye la dirección arquitectónica actual.

La existencia de componentes legacy no implica que todos estén sin uso.

La migración debe continuar por módulos y dependencias verificadas.

El inventario de SonarCloud debe utilizarse como apoyo para priorizar áreas de revisión, no como sustituto del análisis de dependencias.

---

## 34. Relación con deuda técnica

La migración legacy forma parte de la deuda técnica arquitectónica.

Los componentes pendientes deben registrarse y priorizarse según:

- Riesgo.
- Duplicación.
- Uso.
- Complejidad.
- Impacto en seguridad.
- Impacto en mantenimiento.
- Impacto en pruebas.

La deuda debe reducirse mediante cambios verificables.

---

## 35. Mantenimiento

Este documento debe actualizarse cuando:

- Se complete una migración.
- Se descubra un nuevo componente legacy.
- Se cambie la arquitectura objetivo.
- Se elimine una capa de compatibilidad.
- Se detecten nuevas duplicaciones relevantes.
- Cambie la estructura de módulos.

Cada eliminación importante debe quedar respaldada por pruebas y evidencia suficiente.
