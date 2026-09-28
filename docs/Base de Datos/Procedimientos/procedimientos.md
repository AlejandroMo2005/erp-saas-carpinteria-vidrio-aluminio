# Procedimientos de la Base de Datos

## Descripción

La base de datos `inventario_proformas` contiene procedimientos almacenados orientados a operaciones auxiliares sobre la estructura del esquema.

## Índice

- [Descripción](#descripción)
- [Procedimientos](#procedimientos)
- [Agregar columna si no existe](#agregar-columna-si-no-existe)
- [Crear índice](#crear-índice)
- [Consideraciones](#consideraciones)

## Procedimientos

| Procedimiento | Función |
|---|---|
| `_add_column_if_not_exists` | Permite agregar una columna cuando esta no existe en una tabla. |
| `_crear_indice` | Permite crear un índice para una tabla cuando corresponde. |

## Agregar columna si no existe

El procedimiento `_add_column_if_not_exists` proporciona una operación auxiliar para comprobar la existencia de una columna antes de ejecutar su creación.

Su propósito es permitir modificaciones de esquema de forma condicional y reducir errores derivados de intentar crear una columna que ya existe.

## Crear índice

El procedimiento `_crear_indice` proporciona una operación auxiliar para la creación de índices de forma condicional.

Permite comprobar previamente la existencia del índice antes de ejecutar la operación correspondiente sobre la tabla.

## Consideraciones

Estos procedimientos forman parte de las herramientas auxiliares utilizadas para operaciones de modificación del esquema.

Su uso debe considerar el estado actual de la base de datos para evitar modificaciones incompatibles con la estructura existente.
