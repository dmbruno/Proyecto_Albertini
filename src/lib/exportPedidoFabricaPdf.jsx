import { Document, Page, View, Text, StyleSheet, pdf } from '@react-pdf/renderer'

const C = {
  dark:      '#1e293b',
  darkMid:   '#334155',
  blue:      '#1a4b8b',
  white:     '#ffffff',
  stripe:    '#f1f5f9',
  text:      '#1e293b',
  muted:     '#64748b',
  border:    '#e2e8f0',
  amber:     '#fbbf24',
  kgBg:      '#e8f0fb',
  zona:      '#0f172a',
  zonaBg:    '#e2e8f0',
}

const ZONA_ORDER = [
  'Jujuy',
  'Salta sin redespacho',
  'Salta con redespacho',
  'San Pedro',
  'Güemes / Metán',
]

function sortPorZona(secciones) {
  return [...secciones].sort((a, b) => {
    const zA = ZONA_ORDER.indexOf(a.cliente?.listas_precios?.nombre ?? '')
    const zB = ZONA_ORDER.indexOf(b.cliente?.listas_precios?.nombre ?? '')
    return (zA < 0 ? 999 : zA) - (zB < 0 ? 999 : zB)
  })
}

function agruparConZonas(secciones) {
  const sorted = sortPorZona(secciones)
  const result = []
  let zonaActual = null
  for (const sec of sorted) {
    const zona = sec.cliente?.listas_precios?.nombre ?? null
    if (zona !== zonaActual) {
      result.push({ _esZona: true, nombre: zona ?? 'Sin zona asignada' })
      zonaActual = zona
    }
    result.push(sec)
  }
  return result
}

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8.5,
    color: C.text,
    paddingTop: 30,
    paddingBottom: 44,
    paddingHorizontal: 36,
    backgroundColor: C.white,
  },

  docTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    color: C.blue,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  docFecha: {
    fontSize: 8,
    color: C.muted,
    marginBottom: 16,
  },

  /* Separador de zona */
  zonaRow: {
    backgroundColor: C.zonaBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 10,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  zonaTexto: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: C.zona,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },

  /* bloque por cliente */
  seccion: { marginBottom: 10 },

  /* cabecera oscura: nombre + CUIT */
  secHeader: {
    backgroundColor: C.dark,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  secNombre: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: C.white,
    textTransform: 'uppercase',
  },
  secCuit: { fontSize: 8, color: '#94a3b8' },

  /* fila entrega / comprobante */
  entregaRow: {
    backgroundColor: C.darkMid,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  entregaText: { fontSize: 7.5, color: '#e2e8f0' },
  comprobante: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: C.amber,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* comentario: cierre visual debajo de los productos */
  comentarioRow: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  comentarioText: {
    fontSize: 8,
    color: '#1e3a5f',
    fontFamily: 'Helvetica-Oblique',
  },

  /* tabla */
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.blue,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  th: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: C.white,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  tableRowAlt: { backgroundColor: C.stripe },
  td: { fontSize: 9, color: C.text },
  tdNum: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.dark },

  colProducto: { flex: 1 },
  colNum:      { width: 40, textAlign: 'center' },
  colPrecio:   { width: 70, textAlign: 'right' },

  /* bloque KG */
  kgBox: {
    marginTop: 20,
    backgroundColor: C.kgBg,
    borderWidth: 2,
    borderColor: C.blue,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kgLeft: { flexDirection: 'column' },
  kgLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: C.blue,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  kgFormula: {
    fontSize: 10,
    color: C.muted,
    fontFamily: 'Helvetica-Bold',
  },
  kgValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 16,
    color: C.blue,
  },

  footer: {
    position: 'absolute',
    bottom: 16,
    left: 36,
    right: 36,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 7, color: '#94a3b8' },
})

function fmt(n) {
  if (n == null) return '—'
  return '$ ' + Number(n).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function PedidoFabricaPDF({ pedido, secciones, totalPiezas, totalKg, fecha }) {
  const items = agruparConZonas(secciones)

  return (
    <Document>
      <Page size="A4" style={s.page}>

        <Text style={s.docTitle}>Pedido a fábrica</Text>
        <Text style={s.docFecha}>Fecha: {fecha}</Text>

        {items.map((item, idx) => {
          if (item._esZona) {
            return (
              <View key={`zona-${idx}`} style={s.zonaRow}>
                <Text style={s.zonaTexto}>{item.nombre}</Text>
              </View>
            )
          }

          const { cliente, items: rows } = item
          return (
            <View key={idx} style={s.seccion} wrap={false}>

              <View style={s.secHeader}>
                <Text style={s.secNombre}>{cliente?.razon_social ?? '—'}</Text>
                {cliente?.cuit ? <Text style={s.secCuit}>CUIT {cliente.cuit}</Text> : null}
              </View>

              <View style={s.entregaRow}>
                <Text style={s.entregaText}>
                  {cliente?.entrega
                    ? `ENTREGA: ${cliente.entrega}`
                    : cliente?.direccion
                    ? `DIRECCIÓN: ${cliente.direccion}`
                    : ''}
                </Text>
                <Text style={s.comprobante}>{cliente?.tipo_comprobante ?? ''}</Text>
              </View>

              <View style={s.tableHeader}>
                <Text style={[s.th, s.colProducto]}>Productos</Text>
                <Text style={[s.th, s.colNum]}>Pallet</Text>
                <Text style={[s.th, s.colNum]}>Cajas</Text>
                <Text style={[s.th, s.colNum]}>Piezas</Text>
                <Text style={[s.th, s.colPrecio]}>Prec Final</Text>
                <Text style={[s.th, s.colPrecio]}>Prec Sin IVA</Text>
              </View>

              {rows.map((row, i) => (
                <View key={row.id ?? i} style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}>
                  <Text style={[s.td, s.colProducto]}>{row.productos?.nombre ?? '—'}</Text>
                  <Text style={[s.tdNum, s.colNum]}>{row.pallet ?? 0}</Text>
                  <Text style={[s.tdNum, s.colNum]}>{row.cajas  ?? 0}</Text>
                  <Text style={[s.tdNum, s.colNum]}>{row.piezas ?? 0}</Text>
                  <Text style={[s.td, s.colPrecio]}>{fmt(row.precio)}</Text>
                  <Text style={[s.td, s.colPrecio]}>{fmt((row.precio ?? 0) / 1.21)}</Text>
                </View>
              ))}

              {cliente?.comentario ? (
                <View style={s.comentarioRow}>
                  <Text style={s.comentarioText}>{cliente.comentario}</Text>
                </View>
              ) : null}
            </View>
          )
        })}

        {/* KG total */}
        <View style={s.kgBox}>
          <View style={s.kgLeft}>
            <Text style={s.kgLabel}>Total KG del pedido</Text>
            <Text style={s.kgFormula}>
              {totalPiezas.toLocaleString('es-AR')} piezas × 4 kg/pieza
            </Text>
          </View>
          <Text style={s.kgValue}>
            {totalKg.toLocaleString('es-AR')} KG
          </Text>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>Pedido a fábrica — {fecha}</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>

      </Page>
    </Document>
  )
}

export async function exportarPedidoFabricaPDF({ pedido, secciones, totalPiezas, totalKg }) {
  const fecha = pedido.fecha
    ? new Date(pedido.fecha + 'T00:00:00').toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      })
    : ''
  const blob = await pdf(
    <PedidoFabricaPDF
      pedido={pedido}
      secciones={secciones}
      totalPiezas={totalPiezas}
      totalKg={totalKg}
      fecha={fecha}
    />
  ).toBlob()
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href     = url
  link.download = `pedido_fabrica_${pedido.fecha ?? Date.now()}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}
