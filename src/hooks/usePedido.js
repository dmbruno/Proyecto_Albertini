import { supabase } from '../lib/supabaseClient'
import { calcSinIva } from '../lib/precios'

// Completa la zona (lista_precios_id) del cliente si todavía no la tiene asignada.
// No pisa una zona ya asignada: el .is('lista_precios_id', null) hace que el
// update sea un no-op si el cliente ya tenía una zona cargada.
async function completarZonaClientes(secciones) {
  const pendientes = secciones.filter(sec => sec.clienteId && sec.listaId)
  await Promise.all(
    pendientes.map(sec =>
      supabase
        .from('clientes')
        .update({ lista_precios_id: sec.listaId })
        .eq('id', sec.clienteId)
        .is('lista_precios_id', null)
    )
  )
}

export function usePedido() {
  const guardar = async ({ secciones, estado, userId }) => {
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({ estado, usuario_id: userId })
      .select()
      .single()

    if (pedidoError) return { error: pedidoError }

    const rows = secciones.flatMap(sec =>
      sec.items
        .filter(i => i.producto_id)
        .map(i => ({
          pedido_id:   pedido.id,
          cliente_id:  sec.clienteId,
          producto_id: i.producto_id,
          pallet:      Number(i.pallet) || 0,
          cajas:       Number(i.cajas)  || 0,
          piezas:      ((Number(i.pallet) * (Number(i.un_pallet) || 0)) + Number(i.cajas)) * (Number(i.un_caja) || 0),
          precio:        Number(i.precio) || 0,
          precio_sin_iva: calcSinIva(Number(i.precio) || 0),
        }))
    )

    if (rows.length > 0) {
      const { error: itemsError } = await supabase.from('pedido_items').insert(rows)
      if (itemsError) return { error: itemsError }
    }

    await completarZonaClientes(secciones)

    return { data: pedido, error: null }
  }

  const marcarEnviado = async (pedidoId) => {
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: 'enviado' })
      .eq('id', pedidoId)
    return { error }
  }

  const cargar = async (pedidoId) => {
    const [{ data: pedido, error: pErr }, { data: items, error: iErr }] = await Promise.all([
      supabase.from('pedidos').select('*').eq('id', pedidoId).single(),
      supabase
        .from('pedido_items')
        .select('*, clientes(razon_social, cuit, direccion, entrega, tipo_comprobante, condicion_iva, lista_precios_id, comentario, listas_precios(id, nombre)), productos(nombre, un_pallet, un_caja)')
        .eq('pedido_id', pedidoId)
        .order('cliente_id'),
    ])
    return { pedido, items: items ?? [], error: pErr || iErr }
  }

  const actualizar = async ({ pedidoId, secciones, estado }) => {
    const { error: pedidoError } = await supabase
      .from('pedidos')
      .update({ estado })
      .eq('id', pedidoId)

    if (pedidoError) return { error: pedidoError }

    const { error: deleteError } = await supabase
      .from('pedido_items')
      .delete()
      .eq('pedido_id', pedidoId)

    if (deleteError) return { error: deleteError }

    const rows = secciones.flatMap(sec =>
      sec.items
        .filter(i => i.producto_id)
        .map(i => ({
          pedido_id:   pedidoId,
          cliente_id:  sec.clienteId,
          producto_id: i.producto_id,
          pallet:      Number(i.pallet) || 0,
          cajas:       Number(i.cajas)  || 0,
          piezas:      ((Number(i.pallet) * (Number(i.un_pallet) || 0)) + Number(i.cajas)) * (Number(i.un_caja) || 0),
          precio:        Number(i.precio) || 0,
          precio_sin_iva: calcSinIva(Number(i.precio) || 0),
        }))
    )

    if (rows.length > 0) {
      const { error: itemsError } = await supabase.from('pedido_items').insert(rows)
      if (itemsError) return { error: itemsError }
    }

    await completarZonaClientes(secciones)

    return { error: null }
  }

  return { guardar, actualizar, marcarEnviado, cargar }
}
