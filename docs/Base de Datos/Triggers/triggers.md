# Triggers de la Base de Datos

## Descripción

La base de datos `inventario_proformas` utiliza triggers para mantener automáticamente determinados valores derivados cuando se insertan registros en tablas de detalle.

## Índice

- [Descripción](#descripción)
- [Triggers](#triggers)
- [Actualizar totales de factura](#actualizar-totales-de-factura)
- [Actualizar total de pedido](#actualizar-total-de-pedido)
- [Actualizar total de proforma](#actualizar-total-de-proforma)
- [Consideraciones](#consideraciones)

## Triggers

| Trigger | Evento | Tabla | Función |
|---|---|---|---|
| `actualizar_totales_factura` | `AFTER INSERT` | `factura_detalle` | Actualiza los totales acumulados de la factura. |
| `actualizar_total_pedido` | `AFTER INSERT` | `pedido_detalle` | Actualiza el total del pedido. |
| `actualizar_total_proforma` | `AFTER INSERT` | `proforma_detalle` | Actualiza el total de la proforma. |

## Actualizar totales de factura

El trigger `actualizar_totales_factura` se ejecuta después de insertar un registro en `factura_detalle`.

Su función es recalcular los valores acumulados de la factura a partir de sus registros de detalle, actualizando:

- `subtotal_sin_iva`
- `subtotal_con_iva`
- `iva`
- `total`

El cálculo se realiza utilizando los registros asociados a la factura mediante `factura_id`.

## Actualizar total de pedido

El trigger `actualizar_total_pedido` se ejecuta después de insertar un registro en `pedido_detalle`.

Su función es actualizar el campo `total` de la entidad `pedidos` mediante la suma de:

```text
cantidad × precio_unitario
