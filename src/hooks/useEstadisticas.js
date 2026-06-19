import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

function calcSubtotal(item) {
  const up = item.productos?.un_pallet ?? 0
  const uc = item.productos?.un_caja   ?? 0
  const tp = (item.pallet * up) + (item.cajas * uc) + item.piezas
  return tp * item.precio
}

export function useEstadisticas() {
  const [pedidos,  setPedidos]  = useState([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  const fetchEstadisticas = useCallback(async ({ desde, hasta }) => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        id, fecha, estado,
        pedido_items(
          pallet, cajas, piezas, precio,
          clientes(razon_social),
          productos(nombre, un_pallet, un_caja)
        )
      `)
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha', { ascending: true })

    if (error) { setError(error.message); setLoading(false); return }
    setPedidos(data ?? [])
    setLoading(false)
  }, [])

  /* ── agregaciones ── */
  const ventasPorPedido = pedidos.map(p => {
    const total = (p.pedido_items ?? []).reduce((s, i) => s + calcSubtotal(i), 0)
    return { fecha: p.fecha, total, estado: p.estado }
  })

  const topProductos = (() => {
    const map = {}
    pedidos.forEach(p =>
      (p.pedido_items ?? []).forEach(item => {
        const key = item.productos?.nombre ?? 'Sin nombre'
        map[key] = (map[key] ?? 0) + calcSubtotal(item)
      })
    )
    return Object.entries(map)
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
  })()

  const topClientes = (() => {
    const map = {}
    pedidos.forEach(p =>
      (p.pedido_items ?? []).forEach(item => {
        const key = item.clientes?.razon_social ?? 'Sin nombre'
        map[key] = (map[key] ?? 0) + calcSubtotal(item)
      })
    )
    return Object.entries(map)
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
  })()

  const totalFacturado   = ventasPorPedido.reduce((s, p) => s + p.total, 0)
  const cantidadPedidos  = pedidos.length
  const mejorProducto    = topProductos[0]?.nombre  ?? '—'
  const mejorCliente     = topClientes[0]?.nombre   ?? '—'

  return {
    loading, error,
    ventasPorPedido, topProductos, topClientes,
    totalFacturado, cantidadPedidos, mejorProducto, mejorCliente,
    fetchEstadisticas,
  }
}
