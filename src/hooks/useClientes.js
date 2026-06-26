import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useClientes() {
  const [clientes, setClientes] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const fetchClientes = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('clientes')
      .select('*, listas_precios(*)')
      .order('razon_social')
    setClientes(data ?? [])
    setError(error?.message ?? null)
    setLoading(false)
  }, [])

  useEffect(() => { fetchClientes() }, [fetchClientes])

  const crear = async (values) => {
    const { error } = await supabase
      .from('clientes')
      .insert(values)
    if (!error) await fetchClientes()
    return { error }
  }

  const actualizar = async (id, values) => {
    const { error } = await supabase
      .from('clientes')
      .update(values)
      .eq('id', id)
    if (!error) await fetchClientes()
    return { error }
  }

  const toggleActivo = async (id, nuevoEstado) => {
    const { error } = await supabase
      .from('clientes')
      .update({ activo: nuevoEstado })
      .eq('id', id)
    if (!error) await fetchClientes()
    return { error }
  }

  const eliminar = async (id) => {
    // Bloquear si el cliente tiene items en pedidos borrador
    const { data: borradores, error: checkError } = await supabase
      .from('pedido_items')
      .select('id, pedidos!inner(estado)')
      .eq('cliente_id', id)
      .eq('pedidos.estado', 'borrador')
      .limit(1)

    if (checkError) return { error: checkError }

    if (borradores?.length > 0) {
      return {
        error: {
          message: 'Este cliente tiene pedidos en borrador. Cerrá o eliminá esos pedidos antes de eliminar el cliente.',
        },
      }
    }

    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (!error) setClientes(prev => prev.filter(c => c.id !== id))
    return { error }
  }

  return { clientes, loading, error, crear, actualizar, eliminar, toggleActivo, refetch: fetchClientes }
}
