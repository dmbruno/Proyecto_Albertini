import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useListasPrecios() {
  const [listas,  setListas]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetchListas = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('listas_precios')
      .select('*')
      .order('nombre')
    setListas(data ?? [])
    setError(error?.message ?? null)
    setLoading(false)
  }, [])

  useEffect(() => { fetchListas() }, [fetchListas])

  const actualizar = async (id, values) => {
    const { data, error } = await supabase
      .from('listas_precios')
      .update(values)
      .eq('id', id)
      .select()
      .single()
    if (!error) {
      setListas(prev => prev.map(l => l.id === id ? data : l))
    }
    return { data, error }
  }

  return { listas, loading, error, actualizar, refetch: fetchListas }
}
