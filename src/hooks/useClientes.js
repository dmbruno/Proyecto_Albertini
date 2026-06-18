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
      .select('*')
      .order('razon_social')
    setClientes(data ?? [])
    setError(error?.message ?? null)
    setLoading(false)
  }, [])

  useEffect(() => { fetchClientes() }, [fetchClientes])

  const crear = async (values) => {
    const { data, error } = await supabase
      .from('clientes')
      .insert(values)
      .select()
      .single()
    if (!error) {
      setClientes(prev =>
        [...prev, data].sort((a, b) => a.razon_social.localeCompare(b.razon_social))
      )
    }
    return { data, error }
  }

  const actualizar = async (id, values) => {
    const { data, error } = await supabase
      .from('clientes')
      .update(values)
      .eq('id', id)
      .select()
      .single()
    if (!error) {
      setClientes(prev => prev.map(c => c.id === id ? data : c))
    }
    return { data, error }
  }

  const eliminar = async (id) => {
    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (!error) {
      setClientes(prev => prev.filter(c => c.id !== id))
    }
    return { error }
  }

  return { clientes, loading, error, crear, actualizar, eliminar, refetch: fetchClientes }
}
