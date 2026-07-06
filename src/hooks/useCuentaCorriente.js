import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useSaldos() {
  const [saldos,  setSaldos]  = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const fetchSaldos = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('saldos_clientes')
      .select('*')
      .order('razon_social')
    setSaldos(data ?? [])
    setError(error?.message ?? null)
    setLoading(false)
  }, [])

  return { saldos, loading, error, fetchSaldos }
}

// Facturas y remitos (tipo FAC o REMITO) sin marcar como pagados, de todos los
// clientes, ordenados por fecha de vencimiento — alimenta el panel "Facturas por vencer".
// El remito se incluye porque a los clientes que venden "sin factura" se les
// carga como su comprobante de venta real (ver efectoDe en lib/movimientos.js).
export function useFacturasPorVencer() {
  const [facturas, setFacturas] = useState([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  const fetchFacturasPorVencer = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('movimientos_cuenta')
      .select('*, clientes(razon_social)')
      .in('tipo', ['FAC', 'REMITO'])
      .eq('pagada', false)
      .order('fecha_vencimiento', { ascending: true })
    setFacturas(data ?? [])
    setError(error?.message ?? null)
    setLoading(false)
  }, [])

  return { facturas, loading, error, fetchFacturasPorVencer }
}

// Todos los pagos con cheque/echeq, de todos los clientes y en cualquier
// estado, ordenados por vencimiento del cheque — alimenta la vista global
// de cheques (filtrable por estado ahí mismo).
export function useCarteraCheques() {
  const [cheques, setCheques] = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const fetchCarteraCheques = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('movimientos_cuenta')
      .select('*, clientes(razon_social)')
      .eq('tipo', 'PAGO')
      .in('medio_pago', ['CHEQUE', 'ECHEQ'])
      .order('cheque_vencimiento', { ascending: true })
    setCheques(data ?? [])
    setError(error?.message ?? null)
    setLoading(false)
  }, [])

  return { cheques, loading, error, fetchCarteraCheques }
}

// Todos los movimientos de todos los clientes en un rango de fechas —
// alimenta la vista global "Movimientos" (libro de cuenta corriente).
export function useMovimientosGlobales() {
  const [movimientos, setMovimientos] = useState([])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)

  const fetchMovimientosGlobales = useCallback(async ({ desde, hasta }) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('movimientos_cuenta')
      .select('*, clientes(razon_social), productos(nombre)')
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })
    setMovimientos(data ?? [])
    setError(error?.message ?? null)
    setLoading(false)
  }, [])

  return { movimientos, loading, error, fetchMovimientosGlobales }
}

// Standalone: no depende de un cliente puntual, usable desde cualquier pantalla
// (cuenta de un cliente o la vista global de cheques). Cambia el estado de un
// cheque y, si se lo está sacando de RECHAZADO, busca los movimientos CH-RECH
// vinculados (por movimiento_relacionado_id) para que la pantalla pueda
// ofrecer eliminarlos — siempre con confirmación del usuario, nunca en silencio.
export async function cambiarEstadoCheque(id, nuevoEstado, estadoAnterior, datosExtra = {}) {
  const { error } = await supabase
    .from('movimientos_cuenta')
    .update({ cheque_estado: nuevoEstado, ...datosExtra })
    .eq('id', id)
  if (error) return { error }

  let chRechRelacionados = []
  if (estadoAnterior === 'RECHAZADO' && nuevoEstado !== 'RECHAZADO') {
    const { data } = await supabase
      .from('movimientos_cuenta')
      .select('*')
      .eq('movimiento_relacionado_id', id)
      .eq('tipo', 'CH-RECH')
    chRechRelacionados = data ?? []
  }

  return { error: null, esRechazo: nuevoEstado === 'RECHAZADO', chRechRelacionados }
}

// Standalone también — borra uno o varios movimientos por id (usado para
// limpiar los CH-RECH relacionados al revertir un rechazo).
export async function eliminarMovimientos(ids) {
  const { error } = await supabase.from('movimientos_cuenta').delete().in('id', ids)
  return { error }
}

// Standalone — pone pagada:true en una factura, sin crear ningún movimiento.
// Se usa tanto para la opción secundaria ("ya lo cobré por otro medio") como
// internamente después de registrar el pago que salda la factura.
export async function marcarFacturaPagada(id) {
  const { error } = await supabase.from('movimientos_cuenta').update({ pagada: true }).eq('id', id)
  return { error }
}

function movimientoRow(clienteId, payload) {
  return {
    cliente_id:                clienteId,
    tipo:                      payload.tipo,
    monto:                     Number(payload.monto),
    monto_neto:                payload.montoNeto != null ? Number(payload.montoNeto) : null,
    descripcion:               payload.descripcion || null,
    fecha:                     payload.fecha || new Date().toISOString().slice(0, 10),
    numero_comprobante:        payload.numeroComprobante || null,
    fecha_vencimiento:         payload.fechaVencimiento || null,
    producto_id:               payload.productoId || null,
    ajuste_efecto:             payload.ajusteEfecto || null,
    medio_pago:                payload.medioPago || null,
    cheque_numero:             payload.chequeNumero || null,
    cheque_banco:              payload.chequeBanco || null,
    cheque_titular:            payload.chequeTitular || null,
    cheque_fecha_emision:      payload.chequeFechaEmision || null,
    cheque_vencimiento:        payload.chequeVencimiento || null,
    movimiento_relacionado_id: payload.movimientoRelacionadoId || null,
    factura_categoria:         payload.facturaCategoria || null,
    factura_imagen_url:        payload.facturaImagenUrl || null,
  }
}

// Standalone — sube la imagen/PDF de una factura al bucket privado "facturas",
// organizada por cliente (facturas/{clienteId}/...) para que no quede todo
// suelto en la raíz. Devuelve el path guardado (no una URL pública, porque el
// bucket es privado) — para verla hay que pedir un link firmado con verFactura.
export async function subirImagenFactura(clienteId, file) {
  const ext = file.name.split('.').pop()
  const path = `${clienteId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('facturas').upload(path, file)
  if (error) return { path: null, error }
  return { path, error: null }
}

// Standalone — genera un link temporal para ver/descargar la imagen y lo abre
// en una pestaña nueva. El link firmado expira a los 5 minutos.
export async function verFactura(path) {
  const { data, error } = await supabase.storage.from('facturas').createSignedUrl(path, 60 * 5)
  if (error) return { error }
  window.open(data.signedUrl, '_blank')
  return { error: null }
}

// Standalone — no depende de un cliente puntual, usable desde la vista global
// de movimientos (ahí cada fila ya trae su propio cliente_id).
export async function registrarMovimientoStandalone(clienteId, payload) {
  const { error } = await supabase
    .from('movimientos_cuenta')
    .insert(movimientoRow(clienteId, payload))
  return { error }
}

export function useCuentaCorriente(clienteId) {
  const [movimientos, setMovimientos] = useState([])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)

  const fetchMovimientos = useCallback(async () => {
    if (!clienteId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('movimientos_cuenta')
      .select('*, productos(nombre)')
      .eq('cliente_id', clienteId)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })
    setMovimientos(data ?? [])
    setError(error?.message ?? null)
    setLoading(false)
  }, [clienteId])

  const registrarMovimiento = async (payload) => {
    const result = await registrarMovimientoStandalone(clienteId, payload)
    if (!result.error) await fetchMovimientos()
    return result
  }

  const actualizarMovimiento = async (id, payload) => {
    const { error } = await supabase
      .from('movimientos_cuenta')
      .update(movimientoRow(clienteId, payload))
      .eq('id', id)
    if (!error) await fetchMovimientos()
    return { error }
  }

  const eliminarMovimiento = async (id) => {
    const { error } = await supabase
      .from('movimientos_cuenta')
      .delete()
      .eq('id', id)
    if (!error) await fetchMovimientos()
    return { error }
  }

  const marcarComoPagada = async (id) => {
    const result = await marcarFacturaPagada(id)
    if (!result.error) await fetchMovimientos()
    return result
  }

  // Actualiza el estado del cheque de un pago. Si el nuevo estado es 'RECHAZADO',
  // devuelve esRechazo:true para que la pantalla ofrezca crear el CH-RECH
  // relacionado; si se lo está sacando de RECHAZADO, devuelve los CH-RECH
  // vinculados para que la pantalla ofrezca eliminarlos. Siempre con
  // confirmación del usuario, nunca en silencio.
  const actualizarEstadoCheque = async (id, nuevoEstado, datosExtra = {}) => {
    const estadoAnterior = movimientos.find(m => m.id === id)?.cheque_estado
    const result = await cambiarEstadoCheque(id, nuevoEstado, estadoAnterior, datosExtra)
    if (!result.error) await fetchMovimientos()
    return result
  }

  return {
    movimientos, loading, error, fetchMovimientos,
    registrarMovimiento, actualizarMovimiento, eliminarMovimiento,
    marcarComoPagada, actualizarEstadoCheque,
  }
}
