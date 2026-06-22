import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useAdminUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const fetchUsuarios = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.functions.invoke('admin-usuarios', { method: 'GET' })
    if (error) {
      setError(error.message ?? 'Error al cargar usuarios')
    } else {
      const sorted = (data?.users ?? []).sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      )
      setUsuarios(sorted)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsuarios() }, [fetchUsuarios])

  const crearUsuario = async ({ email, password }) => {
    const { data, error } = await supabase.functions.invoke('admin-usuarios', {
      body: { email, password },
    })
    if (!error && data?.user) {
      setUsuarios(prev => [...prev, data.user])
    }
    return { data, error }
  }

  const editarUsuario = async ({ id, email, password }) => {
    const { data, error } = await supabase.functions.invoke('admin-usuarios', {
      method: 'PUT',
      body: { id, email, ...(password ? { password } : {}) },
    })
    if (!error && data?.user) {
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, ...data.user } : u))
    }
    return { data, error }
  }

  const eliminarUsuario = async (id) => {
    const { data, error } = await supabase.functions.invoke('admin-usuarios', {
      method: 'DELETE',
      body: { id },
    })
    if (!error) {
      setUsuarios(prev => prev.filter(u => u.id !== id))
    }
    return { data, error }
  }

  return { usuarios, loading, error, crearUsuario, editarUsuario, eliminarUsuario, refetch: fetchUsuarios }
}
