import * as XLSX from 'xlsx'

function calcSubtotal(item) {
  const up = item.productos?.un_pallet ?? 0
  const uc = item.productos?.un_caja   ?? 0
  const tp = (item.pallet * up) + (item.cajas * uc) + item.piezas
  return tp * item.precio
}

export function exportarPedidoExcel(pedido, secciones) {
  const fecha = pedido.fecha
    ? new Date(pedido.fecha + 'T00:00:00').toLocaleDateString('es-AR')
    : ''

  const totalGeneral = secciones
    .flatMap(s => s.items)
    .reduce((sum, i) => sum + calcSubtotal(i), 0)

  const wsData = [
    ['PEDIDO A MAYORISTA'],
    [`Fecha: ${fecha}    Estado: ${pedido.estado ?? ''}`],
    [],
  ]

  for (const { cliente, items } of secciones) {
    const subtotal = items.reduce((sum, i) => sum + calcSubtotal(i), 0)

    wsData.push(
      ['Cliente:',          cliente?.razon_social    ?? ''],
      ['CUIT:',             cliente?.cuit            ?? ''],
      ['Dirección:',        cliente?.direccion       ?? ''],
      ['Entrega:',          cliente?.entrega         ?? ''],
      ['Tipo comprobante:', cliente?.tipo_comprobante ?? ''],
      [],
      ['Producto', 'Pallet', 'Cajas', 'Piezas', 'Precio unitario', 'Subtotal'],
    )

    for (const item of items) {
      const up = item.productos?.un_pallet ?? 0
      const uc = item.productos?.un_caja   ?? 0
      const tp = (item.pallet * up) + (item.cajas * uc) + item.piezas
      wsData.push([
        item.productos?.nombre ?? '',
        item.pallet,
        item.cajas,
        item.piezas,
        item.precio,
        tp * item.precio,
      ])
    }

    wsData.push(
      ['', '', '', '', 'Subtotal cliente', subtotal],
      [],
    )
  }

  wsData.push(['', '', '', '', 'TOTAL GENERAL', totalGeneral])

  const ws = XLSX.utils.aoa_to_sheet(wsData)

  ws['!cols'] = [
    { wch: 40 }, { wch: 9 }, { wch: 9 },
    { wch: 9 },  { wch: 18 }, { wch: 14 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Pedido')

  XLSX.writeFile(wb, `pedido_${pedido.fecha ?? Date.now()}.xlsx`)
}
