import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function usePedidos() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetchPedidos = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('pedidos')
      .select('id, fecha, estado, created_at, pedido_items(cliente_id, clientes(razon_social))')
      .order('created_at', { ascending: false })
    setPedidos(data ?? [])
    setError(error?.message ?? null)
    setLoading(false)
  }, [])

  useEffect(() => { fetchPedidos() }, [fetchPedidos])

  const eliminar = async (id) => {
    const { error } = await supabase.from('pedidos').delete().eq('id', id)
    if (!error) setPedidos(prev => prev.filter(p => p.id !== id))
    return { error }
  }

  return { pedidos, loading, error, eliminar, refetch: fetchPedidos }
}
