import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { calcKgEstimado } from '../lib/precios'

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
          piezas,
          clientes(razon_social),
          productos(nombre)
        )
      `)
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha', { ascending: true })

    if (error) { setError(error.message); setLoading(false); return }
    setPedidos(data ?? [])
    setLoading(false)
  }, [])

  /* ── agregaciones (todo en Kg estimados, no en importe) ── */
  const ventasPorPedido = pedidos.map(p => {
    const totalKg = (p.pedido_items ?? []).reduce((s, i) => s + calcKgEstimado(i.piezas), 0)
    return { fecha: p.fecha, total: totalKg, estado: p.estado }
  })

  const topProductos = (() => {
    const map = {}
    pedidos.forEach(p =>
      (p.pedido_items ?? []).forEach(item => {
        const key = item.productos?.nombre ?? 'Sin nombre'
        map[key] = (map[key] ?? 0) + calcKgEstimado(item.piezas)
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
        map[key] = (map[key] ?? 0) + calcKgEstimado(item.piezas)
      })
    )
    return Object.entries(map)
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
  })()

  const totalKg          = ventasPorPedido.reduce((s, p) => s + p.total, 0)
  const cantidadPedidos  = pedidos.length
  const mejorProducto    = topProductos[0]?.nombre  ?? '—'
  const mejorCliente     = topClientes[0]?.nombre   ?? '—'

  return {
    loading, error,
    ventasPorPedido, topProductos, topClientes,
    totalKg, cantidadPedidos, mejorProducto, mejorCliente,
    fetchEstadisticas,
  }
}
