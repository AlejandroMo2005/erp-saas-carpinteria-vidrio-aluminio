// src/presentation/components/Materiales/hooks/useMaterialesActions.js
// Sprint 18 — Refactorización modular
// Responsabilidad: estado de selección de variante, campos editados,
// optimistic update + rollback, y los tres handlers que usa Materiales.jsx.

import { useState, useCallback, useMemo } from 'react';
import { materialesKeys } from '../../../hooks/useMateriales';
import { sanitizarTexto, validarNumero } from '../utils/materialesUtils';
import { STOCK_MAX, PRECIO_MAX } from '../constants/materialesConstants';

export function useMaterialesActions({
  grupos,
  esAdmin,
  actualizarVariante,
  queryClient,
  pushToast,
}) {
  const [seleccion, setSeleccion] = useState({});
  const [editando,  setEditando]  = useState({});
  const [guardando, setGuardando] = useState({});

  // Valores efectivos — useMemo en lugar de useEffect+setState: sin render extra.
  const seleccionEfectiva = useMemo(() => {
    const result = {};
    grupos.forEach(([k, v]) => { result[k] = seleccion[k] ?? v[0]; });
    return result;
  }, [grupos, seleccion]);

  const editandoEfectivo = useMemo(() => {
    const result = {};
    grupos.forEach(([k, v]) => {
      const activo = seleccion[k] ?? v[0];
      result[k] = editando[k] ?? { stock: activo.stock, precio: activo.precio };
    });
    return result;
  }, [grupos, seleccion, editando]);

  const handleSeleccionar = useCallback((key, variante) => {
    setSeleccion((prev) => ({ ...prev, [key]: variante }));
    setEditando((prev) => ({
      ...prev,
      [key]: { stock: variante.stock, precio: variante.precio },
    }));
  }, []);

  const handleCampo = useCallback((key, campo, valor) => {
    setEditando((prev) => ({
      ...prev,
      [key]: { ...editandoEfectivo[key], [campo]: valor },
    }));
  }, [editandoEfectivo]);

  const handleGuardar = useCallback(async (key) => {
    if (guardando[key] || !esAdmin) return;

    // seleccionEfectiva[key] siempre tiene el objeto completo
    // (seleccion[key] puede ser undefined si el usuario nunca hizo click)
    const varActual = seleccionEfectiva[key];
    const vals      = editandoEfectivo[key];

    const stockVal  = validarNumero(vals.stock, 0, STOCK_MAX);
    const precioVal = validarNumero(vals.precio, 0, PRECIO_MAX);

    if (Number.isNaN(stockVal) || Number.isNaN(precioVal)) {
      pushToast('Valores inválidos. Verifica stock y precio.', 'error');
      return;
    }

    setGuardando((prev) => ({ ...prev, [key]: true }));
    const stockAnt  = varActual.stock;
    const precioAnt = varActual.precio;

    // Optimistic update
    queryClient.setQueryData(materialesKeys.conColores(), (old = []) =>
      old.map((v) => v.variante_id === varActual.variante_id
        ? { ...v, stock: stockVal, precio: precioVal }
        : v
      )
    );

    setSeleccion((prev) => ({
      ...prev,
      [key]: { ...varActual, stock: stockVal, precio: precioVal },
    }));

    try {
      await actualizarVariante.mutateAsync({
        varianteId: varActual.variante_id,
        stock:      stockVal,
        precio:     Number.parseFloat(precioVal.toFixed(2)),
      });

      pushToast(
        `${sanitizarTexto(varActual.nombre_material)} (${sanitizarTexto(varActual.color_nombre)}) actualizado`,
        'success'
      );
    } catch (err) {
      // Rollback
      queryClient.setQueryData(materialesKeys.conColores(), (old = []) =>
        old.map((v) => v.variante_id === varActual.variante_id
          ? { ...v, stock: stockAnt, precio: precioAnt }
          : v
        )
      );

      setSeleccion((prev) => ({
        ...prev,
        [key]: { ...varActual, stock: stockAnt, precio: precioAnt },
      }));

      setEditando((prev) => ({
        ...prev,
        [key]: { stock: stockAnt, precio: precioAnt },
      }));

      const msg = err.response?.status === 403
        ? 'Sin permisos para actualizar este material.'
        : err.response?.status === 404
          ? 'Material no encontrado.'
          : 'Error al guardar. Inténtalo de nuevo.';

      pushToast(msg, 'error');
    } finally {
      setGuardando((prev) => ({ ...prev, [key]: false }));
    }
  }, [
    guardando,
    seleccionEfectiva,
    editandoEfectivo,
    esAdmin,
    actualizarVariante,
    queryClient,
    pushToast,
  ]);

  return {
    seleccionEfectiva,
    editandoEfectivo,
    guardando,
    handleSeleccionar,
    handleCampo,
    handleGuardar,
  };
}
