import {
  Document, Page, View, Text,
  StyleSheet, pdf,
} from '@react-pdf/renderer'

/* ── palette ── */
const C = {
  primary:       '#1a4b8b',
  primaryMid:    '#2563b0',
  primaryLight:  '#e8f0fb',
  accent:        '#ea580c',
  text:          '#1e293b',
  muted:         '#64748b',
  subtle:        '#94a3b8',
  border:        '#e2e8f0',
  stripe:        '#f8fafc',
  white:         '#ffffff',
}

const COL = {
  producto:  { flex: 1 },
  num:       { width: 44, textAlign: 'center' },
  precio:    { width: 72, textAlign: 'right' },
  subtotal:  { width: 80, textAlign: 'right' },
}

const s = StyleSheet.create({
  /* página */
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.text,
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
    backgroundColor: C.white,
  },

  /* ── cabecera del documento ── */
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 12,
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: C.primary,
  },
  brandName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 20,
    color: C.primary,
    letterSpacing: 1.5,
  },
  brandSub: {
    fontSize: 7.5,
    color: C.muted,
    marginTop: 2,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  docMetaBlock: {
    alignItems: 'flex-end',
  },
  docLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: C.text,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  docFecha: {
    fontSize: 8.5,
    color: C.muted,
    marginTop: 3,
  },
  estadoPill: {
    marginTop: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    alignSelf: 'flex-end',
  },
  estadoText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  /* ── bloque por cliente ── */
  seccion: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    overflow: 'hidden',
  },

  /* cabecera azul del cliente */
  clienteBar: {
    backgroundColor: C.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clienteNombre: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: C.white,
  },
  clienteTipo: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: '#93c5fd',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* fila de datos fiscales */
  clienteDatos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: C.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  dato: {
    flexDirection: 'row',
    marginRight: 20,
    marginBottom: 2,
  },
  datoLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: C.muted,
    textTransform: 'uppercase',
    marginRight: 3,
  },
  datoValue: {
    fontSize: 7.5,
    color: C.text,
  },

  /* tabla de productos */
  tableHead: {
    flexDirection: 'row',
    backgroundColor: C.stripe,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  th: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tableRowAlt: {
    backgroundColor: C.stripe,
  },
  td: {
    fontSize: 8.5,
    color: C.text,
  },
  tdBold: {
    fontFamily: 'Helvetica-Bold',
  },

  /* subtotal por cliente */
  secSubtotalRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: C.primaryLight,
    borderTopWidth: 1,
    borderTopColor: '#bfdbfe',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  secSubtotalLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginRight: 12,
  },
  secSubtotalValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    color: C.primary,
    width: 80,
    textAlign: 'right',
  },

  /* total general */
  totalGeneral: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.primary,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 4,
    marginTop: 6,
  },
  totalLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: C.white,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  totalValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    color: C.white,
  },

  /* pie de página */
  pageFooter: {
    position: 'absolute',
    bottom: 18,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 5,
  },
  footerText: {
    fontSize: 7,
    color: C.subtle,
  },
})

/* ── helpers ── */
function fmt(n) {
  return '$' + Number(n).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
function calcSubtotal(item) {
  const up = item.productos?.un_pallet ?? 0
  const uc = item.productos?.un_caja   ?? 0
  const tp = (item.pallet * up) + (item.cajas * uc) + item.piezas
  return tp * item.precio
}

/* ── componente PDF ── */
function PedidoPDF({ pedido, secciones }) {
  const fecha = pedido.fecha
    ? new Date(pedido.fecha + 'T00:00:00').toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      })
    : ''
  const totalGeneral = secciones
    .flatMap(s => s.items)
    .reduce((sum, i) => sum + calcSubtotal(i), 0)

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* cabecera del documento */}
        <View style={s.docHeader} fixed>
          <View>
            <Text style={s.brandName}>ALBERTINI</Text>
            <Text style={s.brandSub}>Gestión de pedidos</Text>
          </View>
          <View style={s.docMetaBlock}>
            <Text style={s.docLabel}>Pedido a mayorista</Text>
            <Text style={s.docFecha}>Fecha: {fecha}</Text>
          </View>
        </View>

        {/* secciones por cliente */}
        {secciones.map(({ cliente, items }, idx) => {
          const subtotal = items.reduce((sum, i) => sum + calcSubtotal(i), 0)
          return (
            <View key={idx} style={s.seccion} wrap={false}>

              {/* barra del cliente */}
              <View style={s.clienteBar}>
                <Text style={s.clienteNombre}>{cliente?.razon_social ?? '—'}</Text>
                {cliente?.tipo_comprobante
                  ? <Text style={s.clienteTipo}>{cliente.tipo_comprobante}</Text>
                  : null}
              </View>

              {/* datos fiscales */}
              <View style={s.clienteDatos}>
                {cliente?.cuit && (
                  <View style={s.dato}>
                    <Text style={s.datoLabel}>CUIT:</Text>
                    <Text style={s.datoValue}>{cliente.cuit}</Text>
                  </View>
                )}
                {cliente?.direccion && (
                  <View style={s.dato}>
                    <Text style={s.datoLabel}>Dirección:</Text>
                    <Text style={s.datoValue}>{cliente.direccion}</Text>
                  </View>
                )}
                {cliente?.entrega && (
                  <View style={s.dato}>
                    <Text style={s.datoLabel}>Entrega:</Text>
                    <Text style={s.datoValue}>{cliente.entrega}</Text>
                  </View>
                )}
              </View>

              {/* encabezado de tabla */}
              <View style={s.tableHead}>
                <Text style={[s.th, COL.producto]}>Producto</Text>
                <Text style={[s.th, COL.num]}>Pallet</Text>
                <Text style={[s.th, COL.num]}>Cajas</Text>
                <Text style={[s.th, COL.num]}>Piezas</Text>
                <Text style={[s.th, COL.precio]}>Precio</Text>
                <Text style={[s.th, COL.subtotal]}>Subtotal</Text>
              </View>

              {/* filas */}
              {items.map((item, i) => (
                <View
                  key={item.id ?? i}
                  style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}
                >
                  <Text style={[s.td, COL.producto]}>{item.productos?.nombre ?? '—'}</Text>
                  <Text style={[s.td, COL.num]}>{item.pallet || '—'}</Text>
                  <Text style={[s.td, COL.num]}>{item.cajas  || '—'}</Text>
                  <Text style={[s.td, COL.num]}>{item.piezas || '—'}</Text>
                  <Text style={[s.td, COL.precio]}>{fmt(item.precio)}</Text>
                  <Text style={[s.td, s.tdBold, COL.subtotal]}>{fmt(calcSubtotal(item))}</Text>
                </View>
              ))}

              {/* subtotal del cliente */}
              <View style={s.secSubtotalRow}>
                <Text style={s.secSubtotalLabel}>Subtotal {cliente?.razon_social ?? ''}</Text>
                <Text style={s.secSubtotalValue}>{fmt(subtotal)}</Text>
              </View>
            </View>
          )
        })}

        {/* total general */}
        <View style={s.totalGeneral}>
          <Text style={s.totalLabel}>Total general</Text>
          <Text style={s.totalValue}>{fmt(totalGeneral)}</Text>
        </View>

        {/* pie de página */}
        <View style={s.pageFooter} fixed>
          <Text style={s.footerText}>Albertini — Gestión de pedidos</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}

export async function exportarPedidoPDF(pedido, secciones) {
  const blob = await pdf(<PedidoPDF pedido={pedido} secciones={secciones} />).toBlob()
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href     = url
  link.download = `pedido_${pedido.fecha ?? Date.now()}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}
