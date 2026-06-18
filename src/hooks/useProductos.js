import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useProductos({ soloActivos = false } = {}) {
  const [productos, setProductos] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  const fetchProductos = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('productos').select('*').order('nombre')
    if (soloActivos) q = q.eq('activo', true)
    const { data, error } = await q
    setProductos(data ?? [])
    setError(error?.message ?? null)
    setLoading(false)
  }, [soloActivos])

  useEffect(() => { fetchProductos() }, [fetchProductos])

  const crear = async (values) => {
    const { data, error } = await supabase
      .from('productos')
      .insert(values)
      .select()
      .single()
    if (!error) {
      setProductos(prev =>
        [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre))
      )
    }
    return { data, error }
  }

  const actualizar = async (id, values) => {
    const { data, error } = await supabase
      .from('productos')
      .update(values)
      .eq('id', id)
      .select()
      .single()
    if (!error) {
      setProductos(prev => prev.map(p => p.id === id ? data : p))
    }
    return { data, error }
  }

  const toggleActivo = async (id, activo) => {
    return actualizar(id, { activo })
  }

  return { productos, loading, error, crear, actualizar, toggleActivo, refetch: fetchProductos }
}
